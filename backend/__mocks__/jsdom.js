// Mock de jsdom para tests Jest (evita conflicto ESM/CJS con jsdom v29)
class JSDOM {
  constructor() {
    this.window = {};
  }
}
module.exports = { JSDOM };
