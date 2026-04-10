function o(e,n="Error desconocido"){return e instanceof Error?e.message:typeof e=="string"?e:e&&typeof e=="object"&&"message"in e?String(e.message):n}export{o as e};
