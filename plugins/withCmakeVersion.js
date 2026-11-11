const { withProjectBuildGradle, withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

// Fix 1: Windows's classic 260-char path limit breaks native CMake builds
// for libraries with deep codegen output trees — hit by react-native-
// gesture-handler's Fabric codegen, react-native-reanimated's CSS module,
// and :app's own autolinked codegen build (which combines all modules').
// The CMake 3.22.1 bundled ninja (1.10.2) predates ninja's Windows long-
// path support (added in 1.11); CMake 4.1.2 (ninja 1.12.1) handles it.
//
// This is forced globally via local.properties' cmake.dir (set in the
// build sync script, not here) rather than per-module cmake.version,
// specifically because of :app: its cmake config is injected by the
// React Native Gradle plugin and it's evaluated eagerly as part of root
// project configuration. Setting cmake.version on it directly throws
// "too late to set version" (already read elsewhere), and afterEvaluate
// throws "already evaluated" (too late to even register the callback).
// There is no Groovy-script timing window that works for :app
// specifically, so the version is pinned at the SDK-resolution level
// instead, which every module (including :app) honors with no plugin-
// apply/evaluation-order race.
//
// Forcing 4.1.2 globally means expo-updates' CMakeLists.txt — which
// still declares cmake_minimum_required(VERSION 3.4.1), below CMake 4.x's
// hard floor of 3.5 — needs the CMAKE_POLICY_VERSION_MINIMUM escape hatch
// CMake itself suggests. Scoped to expo-updates alone: applying it to
// modules whose own minimum is already >= 3.5 regressed CMake's default
// policy set in earlier testing and broke other things, so don't widen
// this without re-testing.
const withCmakeVersion = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes('forceCmakeVersion')) return cfg;
    cfg.modResults.contents += `

// forceCmakeVersion: see plugins/withCmakeVersion.js
// CMake's own bundled Android-Common.cmake, for CMAKE_ANDROID_STL_TYPE=
// c++_shared, only ever adds "-stdlib=libc++" to CMAKE_CXX_FLAGS_INIT and
// never an explicit -lc++_shared — confirmed directly against the
// bundled cmake-3.22/Modules/Platform/Android-Common.cmake source. On
// NDK's clang, -stdlib=libc++ only controls header/ABI selection; it does
// NOT make the driver auto-link the shared runtime (confirmed
// empirically: forcing -stdlib=libc++ onto the actual link command,
// verified present in the real compiler invocation, still left
// libc++_shared unlinked). The runtime itself needs an explicit
// -lc++_shared, added here for every native library module.
def cmakeNativeModules = [
  "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets",
  "expo-updates", "expo-modules-core", "react-native-screens", "react-native-svg",
  "react-native-safe-area-context", "react-native-maps"
]
subprojects { subproject ->
  if (cmakeNativeModules.contains(subproject.name)) {
    subproject.plugins.withId("com.android.library") {
      subproject.android.defaultConfig.externalNativeBuild.cmake.arguments(
        "-DCMAKE_ANDROID_STL_TYPE=c++_shared",
        "-DCMAKE_SHARED_LINKER_FLAGS=-stdlib=libc++ -lc++_shared",
        "-DCMAKE_EXE_LINKER_FLAGS=-stdlib=libc++ -lc++_shared"
      )
      if (subproject.name == "expo-updates") {
        subproject.android.defaultConfig.externalNativeBuild.cmake.arguments("-DCMAKE_POLICY_VERSION_MINIMUM=3.5")
      }
    }
  }
  // :app's own build links a combined "appmodules" library pulling in
  // every module's autolinked Fabric codegen (including gesture-
  // handler's) — it needs the same explicit -lc++_shared the individual
  // library modules above get, independently of them, since AGP links
  // :app's native code as its own separate target.
  // Must hook the plugin being applied (not run eagerly): at this point :app has not been
  // evaluated yet, so a bare subproject.android.* call silently never reached the real
  // CMake configure (the cache showed no CMAKE_SHARED_LINKER_FLAGS).
  if (subproject.name == "app") {
    subproject.plugins.withId("com.android.application") {
      subproject.android.defaultConfig.externalNativeBuild.cmake.arguments(
        "-DCMAKE_ANDROID_STL_TYPE=c++_shared",
        "-DCMAKE_SHARED_LINKER_FLAGS=-stdlib=libc++ -lc++_shared",
        "-DCMAKE_EXE_LINKER_FLAGS=-stdlib=libc++ -lc++_shared"
      )
    }
  }
}
`;
    return cfg;
  });

// 32-bit ARM/x86 devices are essentially extinct in current Android
// installs (Play Store has only required 64-bit support since 2021) —
// dropping them shrinks the APK and build time, the standard choice for
// a modern RN app, independent of the native-build fixes above.
const withArm64Only = (config) =>
  withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures'));
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: 'arm64-v8a,x86_64' });
    return cfg;
  });

// :app's own native build (the combined "appmodules" target plus every autolinked Fabric codegen
// library) needs the same explicit -lc++_shared as the library modules. Setting it from the root
// build.gradle never reached :app's CMake configure (verified: CMakeCache had empty linker flags),
// but declaring it inside :app's own defaultConfig does (verified: flags present in CMakeCache).
const withAppCmakeArgs = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes('forceAppCmakeArgs')) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /(defaultConfig\s*\{)/,
      `$1
        // forceAppCmakeArgs: see plugins/withCmakeVersion.js
        externalNativeBuild { cmake { arguments "-DCMAKE_ANDROID_STL_TYPE=c++_shared", "-DCMAKE_SHARED_LINKER_FLAGS=-stdlib=libc++ -lc++_shared", "-DCMAKE_EXE_LINKER_FLAGS=-stdlib=libc++ -lc++_shared" } }`,
    );
    return cfg;
  });

module.exports = (config) => withAppCmakeArgs(withArm64Only(withCmakeVersion(config)));
