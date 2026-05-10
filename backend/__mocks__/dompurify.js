// Mock de dompurify para tests Jest — sanitize devuelve el html sin modificar
module.exports = function createDOMPurify() {
  return {
    sanitize: (html) => (typeof html === 'string' ? html : ''),
  };
};
