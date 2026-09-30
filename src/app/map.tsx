import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { UrlTile, Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function MapScreen() {
  const friendsList = useStore(state => state.friendsList);
  const fetchFriendsList = useStore(state => state.fetchFriendsList);
  const sendFriendRequest = useStore(state => state.sendFriendRequest);
  const respondFriendRequest = useStore(state => state.respondFriendRequest);
  const updateLocationSharing = useStore(state => state.updateLocationSharing);
  const fetchMyLocation = useStore(state => state.fetchMyLocation);
  const fetchFriendLocation = useStore(state => state.fetchFriendLocation);
  const fetchDailyPath = useStore(state => state.fetchDailyPath);
  const removeFriend = useStore(state => state.removeFriend);
  const profile = useStore(state => state.profile);

  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'friends'
  const [myLocation, setMyLocation] = useState(null);
  const [activeFriendId, setActiveFriendId] = useState(null);
  const [friendLocation, setFriendLocation] = useState(null);
  const [dailyPath, setDailyPath] = useState([]);
  
  const [addFriendModal, setAddFriendModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');

  const loadMyLocation = async () => {
    const loc = await fetchMyLocation();
    if (loc) {
      setMyLocation(loc);
      loadPath(profile?.id, new Date().toISOString().split('T')[0]);
    }
  };

  const loadPath = async (userId: string | undefined, date: string) => {
    if (!userId) return;
    const path = await fetchDailyPath(userId, date);
    setDailyPath(path || []);
  };

  // Initial load
  useEffect(() => {
    fetchFriendsList();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMyLocation();
  }, []);

  // Polling friend location if selected
  useEffect(() => {
    let interval: any;
    if (activeFriendId) {
      const pollFriend = async () => {
        const loc = await fetchFriendLocation(activeFriendId);
        if (!loc) {
          Alert.alert("Location Unavailable", "This friend has not shared their location with you or they haven't come online yet.");
        }
        setFriendLocation(loc);
      };
      pollFriend();
      loadPath(activeFriendId, new Date().toISOString().split('T')[0]);
      
      interval = setInterval(async () => {
        const loc = await fetchFriendLocation(activeFriendId);
        setFriendLocation(loc);
      }, 30000); // 30s polling
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFriendLocation(null);
      if (profile) loadPath(profile.id, new Date().toISOString().split('T')[0]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeFriendId]);

  const handleSendRequest = async () => {
    if (!addEmail) return;
    const success = await sendFriendRequest(addEmail);
    if (success) {
      Alert.alert('Success', 'Friend request sent!');
      setAddFriendModal(false);
      setAddEmail('');
    } else {
      Alert.alert('Error', 'Could not send friend request.');
    }
  };

  const pendingRequests = friendsList.filter(f => f.status === 'pending');
  const acceptedFriends = friendsList.filter(f => f.status === 'accepted');

  const getMapRegion = () => {
    const loc = friendLocation || myLocation;
    if (!loc) return { latitude: 24.86, longitude: 67.00, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Tracking</Text>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'map' && styles.activeTab]} 
            onPress={() => setActiveTab('map')}
          >
            <Text style={activeTab === 'map' ? styles.activeTabText : styles.inactiveTabText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]} 
            onPress={() => setActiveTab('friends')}
          >
            <Text style={activeTab === 'friends' ? styles.activeTabText : styles.inactiveTabText}>Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'map' && (
        <View style={{flex: 1}}>
          <MapView 
            style={{ flex: 1 }} 
            region={getMapRegion()}
            mapType="standard"
          >
            <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} zIndex={100} />
            
            {myLocation && !activeFriendId && (
              <Marker coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }} title="Me" pinColor="#4ADE80" zIndex={102} />
            )}
            
            {friendLocation && activeFriendId && (
              <Marker coordinate={{ latitude: friendLocation.latitude, longitude: friendLocation.longitude }} title="Friend" pinColor="#F87171" zIndex={102} />
            )}

            {dailyPath.length > 0 && (
              <Polyline 
                coordinates={dailyPath.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} 
                strokeColor="#60A5FA" 
                strokeWidth={4} 
                zIndex={101}
              />
            )}
          </MapView>
          <View style={styles.attribution}>
            <Text style={{fontSize: 10, color: '#333'}}>© OpenStreetMap contributors</Text>
          </View>
          
          <View style={styles.mapOverlay}>
            <Text style={{color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8}}>Viewing:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.pill, !activeFriendId && styles.activePill]} 
                onPress={() => setActiveFriendId(null)}
              >
                <Text style={!activeFriendId ? styles.activePillText : styles.pillText}>My Location</Text>
              </TouchableOpacity>
              
              {acceptedFriends.map(f => (
                <TouchableOpacity 
                  key={f.id}
                  style={[styles.pill, activeFriendId === f.friend_id && styles.activePill]} 
                  onPress={() => setActiveFriendId(f.friend_id)}
                >
                  <Text style={activeFriendId === f.friend_id ? styles.activePillText : styles.pillText}>
                    {f.name || f.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {activeTab === 'friends' && (
        <ScrollView style={styles.friendsContainer}>
          <TouchableOpacity style={styles.addFriendBtn} onPress={() => setAddFriendModal(true)}>
            <Ionicons name="person-add" size={20} color="#0F1015" />
            <Text style={{color: '#0F1015', fontWeight: 'bold', marginLeft: 8}}>Add Friend</Text>
          </TouchableOpacity>

          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {pendingRequests.map(req => (
                <View key={req.id} style={styles.friendCard}>
                  <View>
                    <Text style={styles.friendName}>{req.name || req.email}</Text>
                    <Text style={styles.friendEmail}>{req.email}</Text>
                  </View>
                  <View style={{flexDirection: 'row', gap: 8}}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => respondFriendRequest(req.friend_id, 'accept')}>
                      <Ionicons name="checkmark" size={20} color="#4ADE80" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => respondFriendRequest(req.friend_id, 'reject')}>
                      <Ionicons name="close" size={20} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted Friends</Text>
            {acceptedFriends.length === 0 ? (
              <Text style={{color: '#8A8A9E'}}>No friends added yet.</Text>
            ) : (
              acceptedFriends.map(f => (
                <View key={f.id} style={styles.friendCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.friendName}>{f.name || f.email}</Text>
                    <Text style={styles.friendEmail}>{f.email}</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={{alignItems: 'center'}}>
                      <Text style={{color: '#8A8A9E', fontSize: 10, marginBottom: 4}}>Share Location</Text>
                      <Switch 
                        value={f.share_enabled} 
                        onValueChange={(val) => updateLocationSharing(f.friend_id, val)}
                        trackColor={{ false: '#2A2A3D', true: '#10B981' }}
                        thumbColor="#fff"
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => {
                        setActiveFriendId(f.friend_id);
                        setActiveTab('map');
                      }}
                    >
                      <Ionicons name="map-outline" size={20} color="#4ADE80" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => removeFriend(f.friend_id)}>
                      <Ionicons name="trash-outline" size={20} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Friend Modal */}
      <Modal visible={addFriendModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setAddFriendModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Friend&apos;s Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="friend@example.com" 
              placeholderTextColor="#8A8A9E" 
              keyboardType="email-address" 
              autoCapitalize="none"
              value={addEmail} 
              onChangeText={setAddEmail} 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSendRequest}>
              <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>Send Request</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E', paddingTop: 60 },
  header: { paddingHorizontal: 24, marginBottom: 16 },
  headerTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', backgroundColor: '#13131A', borderRadius: 16, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#1E293B' },
  activeTabText: { color: '#4ADE80', fontWeight: '800' },
  inactiveTabText: { color: '#64748B', fontWeight: '600' },
  
  attribution: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(15,16,21,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mapOverlay: { position: 'absolute', top: 20, left: 20, right: 20, backgroundColor: 'rgba(19, 19, 26, 0.9)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  
  pill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1E293B', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  activePill: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ADE80' },
  pillText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  activePillText: { color: '#4ADE80', fontSize: 13, fontWeight: '800' },
  
  friendsContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  addFriendBtn: { flexDirection: 'row', backgroundColor: '#4ADE80', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  friendCard: { backgroundColor: '#13131A', padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  friendName: { color: '#E2E8F0', fontSize: 16, fontWeight: '800' },
  friendEmail: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '500' },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1E293B', borderRadius: 16, padding: 18, color: '#F8FAFC', fontSize: 16, fontWeight: '500' },
  saveBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 24, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  saveBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#0F1015', fontSize: 16, fontWeight: '800' }
});
