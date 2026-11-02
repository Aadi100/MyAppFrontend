/**
 * Lightweight on-device category guesser for the transaction form.
 *
 * This used to call into react-native-fast-tflite for a real TensorFlow Lite
 * model, but no model was ever bundled (no assets/models/model.tflite), so
 * that path never ran and the dependency just sat unused — it has been
 * removed. Only the keyword heuristic below is actually used.
 */
class LocalAI {
  private isLoaded = false;

  async init() {
    this.isLoaded = true;
  }

  async predict(inputText: string) {
    return this.fastHeuristic(inputText);
  }

  async fastHeuristic(text: string) {
    const lower = text.toLowerCase();
    let pred = '';
    if (lower.includes('uber') || lower.includes('lyft')) pred = 'Transport';
    else if (lower.includes('mcdonalds') || lower.includes('coffee')) pred = 'Food';
    else if (lower.includes('amazon') || lower.includes('target')) pred = 'Shopping';
    else if (lower.includes('netflix') || lower.includes('spotify')) pred = 'Entertainment';

    return {
      prediction: pred,
      confidence: pred ? 1.0 : 0.0
    };
  }
}

export default new LocalAI();
