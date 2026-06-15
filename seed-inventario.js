require('dotenv').config();
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;

const productos = [
  // ── Ropa ──────────────────────────────────────────────────────
  { categoria: 'Ropa', producto: 'BRUSA MUJER', talla: 'S', stock: 12 },
  { categoria: 'Ropa', producto: 'BRUSA MUJER', talla: 'M', stock: 7 },
  { categoria: 'Ropa', producto: 'BRUSA MUJER', talla: 'L', stock: 5 },
  { categoria: 'Ropa', producto: 'BRUSA MUJER', talla: 'XL', stock: 12 },
  { categoria: 'Ropa', producto: 'BRUSA MUJER', talla: 'XXL', stock: 0 },

  { categoria: 'Ropa', producto: 'CAMISAS HOMBRES', talla: 'S', stock: 7 },
  { categoria: 'Ropa', producto: 'CAMISAS HOMBRES', talla: 'M', stock: 0 },
  { categoria: 'Ropa', producto: 'CAMISAS HOMBRES', talla: 'L', stock: 0 },
  { categoria: 'Ropa', producto: 'CAMISAS HOMBRES', talla: 'XL', stock: 8 },
  { categoria: 'Ropa', producto: 'CAMISAS HOMBRES', talla: 'XXL', stock: 11 },

  { categoria: 'Ropa', producto: 'GEOLOGO 3M', talla: 'S', stock: 13 },
  { categoria: 'Ropa', producto: 'GEOLOGO 3M', talla: 'M', stock: 8 },
  { categoria: 'Ropa', producto: 'GEOLOGO 3M', talla: 'L', stock: 0 },
  { categoria: 'Ropa', producto: 'GEOLOGO 3M', talla: 'XL', stock: 8 },
  { categoria: 'Ropa', producto: 'GEOLOGO 3M', talla: 'XXL', stock: 9 },

  { categoria: 'Ropa', producto: 'GEOLOGO BUFFALO', talla: 'S', stock: 0 },
  { categoria: 'Ropa', producto: 'GEOLOGO BUFFALO', talla: 'M', stock: 0 },
  { categoria: 'Ropa', producto: 'GEOLOGO BUFFALO', talla: 'L', stock: 1 },
  { categoria: 'Ropa', producto: 'GEOLOGO BUFFALO', talla: 'XL', stock: 1 },
  { categoria: 'Ropa', producto: 'GEOLOGO BUFFALO', talla: 'XXL', stock: 0 },

  { categoria: 'Ropa', producto: 'OVEROL IGNIFUGO', talla: 'S', stock: 0 },
  { categoria: 'Ropa', producto: 'OVEROL IGNIFUGO', talla: 'M', stock: 0 },
  { categoria: 'Ropa', producto: 'OVEROL IGNIFUGO', talla: 'L', stock: 4 },
  { categoria: 'Ropa', producto: 'OVEROL IGNIFUGO', talla: 'XL', stock: 4 },
  { categoria: 'Ropa', producto: 'OVEROL IGNIFUGO', talla: 'XXL', stock: 0 },

  { categoria: 'Ropa', producto: 'PANTALON CARGO HOMBRE', talla: 'S', stock: 7 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO HOMBRE', talla: 'M', stock: 10 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO HOMBRE', talla: 'L', stock: 4 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO HOMBRE', talla: 'XL', stock: 0 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO HOMBRE', talla: 'XXL', stock: 3 },

  { categoria: 'Ropa', producto: 'PANTALON CARGO MUJER', talla: 'S', stock: 12 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO MUJER', talla: 'M', stock: 9 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO MUJER', talla: 'L', stock: 14 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO MUJER', talla: 'XL', stock: 8 },
  { categoria: 'Ropa', producto: 'PANTALON CARGO MUJER', talla: 'XXL', stock: 0 },

  { categoria: 'Ropa', producto: 'PARKA AZUL HOMBRE', talla: 'S', stock: 0 },
  { categoria: 'Ropa', producto: 'PARKA AZUL HOMBRE', talla: 'M', stock: 1 },
  { categoria: 'Ropa', producto: 'PARKA AZUL HOMBRE', talla: 'L', stock: 2 },
  { categoria: 'Ropa', producto: 'PARKA AZUL HOMBRE', talla: 'XL', stock: 5 },
  { categoria: 'Ropa', producto: 'PARKA AZUL HOMBRE', talla: 'XXL', stock: 3 },

  { categoria: 'Ropa', producto: 'PARKA AZUL MUJER', talla: 'S', stock: 12 },
  { categoria: 'Ropa', producto: 'PARKA AZUL MUJER', talla: 'M', stock: 9 },
  { categoria: 'Ropa', producto: 'PARKA AZUL MUJER', talla: 'L', stock: 14 },
  { categoria: 'Ropa', producto: 'PARKA AZUL MUJER', talla: 'XL', stock: 8 },
  { categoria: 'Ropa', producto: 'PARKA AZUL MUJER', talla: 'XXL', stock: 0 },

  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE HOMBRE', talla: 'S', stock: 0 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE HOMBRE', talla: 'M', stock: 0 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE HOMBRE', talla: 'L', stock: 0 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE HOMBRE', talla: 'XL', stock: 1 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE HOMBRE', talla: 'XXL', stock: 1 },

  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE MUJER', talla: 'S', stock: 3 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE MUJER', talla: 'M', stock: 2 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE MUJER', talla: 'L', stock: 2 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE MUJER', talla: 'XL', stock: 2 },
  { categoria: 'Ropa', producto: 'POLAR GRIS CON CIERRE MUJER', talla: 'XXL', stock: 2 },

  { categoria: 'Ropa', producto: 'POLAR NEGRO UNISEX', talla: 'S', stock: 8 },
  { categoria: 'Ropa', producto: 'POLAR NEGRO UNISEX', talla: 'M', stock: 6 },
  { categoria: 'Ropa', producto: 'POLAR NEGRO UNISEX', talla: 'L', stock: 8 },
  { categoria: 'Ropa', producto: 'POLAR NEGRO UNISEX', talla: 'XL', stock: 14 },
  { categoria: 'Ropa', producto: 'POLAR NEGRO UNISEX', talla: 'XXL', stock: 29 },

  { categoria: 'Ropa', producto: 'PRIMERA CAPA', talla: 'S', stock: 1 },
  { categoria: 'Ropa', producto: 'PRIMERA CAPA', talla: 'M', stock: 2 },
  { categoria: 'Ropa', producto: 'PRIMERA CAPA', talla: 'L', stock: 7 },
  { categoria: 'Ropa', producto: 'PRIMERA CAPA', talla: 'XL', stock: 13 },
  { categoria: 'Ropa', producto: 'PRIMERA CAPA', talla: 'XXL', stock: 18 },

  { categoria: 'Ropa', producto: 'PARKA REFLECTIVA', talla: 'S', stock: 1 },
  { categoria: 'Ropa', producto: 'PARKA REFLECTIVA', talla: 'M', stock: 0 },
  { categoria: 'Ropa', producto: 'PARKA REFLECTIVA', talla: 'L', stock: 10 },
  { categoria: 'Ropa', producto: 'PARKA REFLECTIVA', talla: 'XL', stock: 10 },
  { categoria: 'Ropa', producto: 'PARKA REFLECTIVA', talla: 'XXL', stock: 10 },

  // ── EPP con talla ─────────────────────────────────────────────
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '38', stock: 0 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '39', stock: 5 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '40', stock: 1 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '41', stock: 0 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '42', stock: 2 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '43', stock: 0 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '44', stock: 5 },
  { categoria: 'EPP', producto: 'ZAPATOS DE SEGURIDAD SHERPA', talla: '45', stock: 7 },

  { categoria: 'EPP', producto: 'RESPIRADOR MEDIO ROSTRO', talla: 'S', stock: 7 },
  { categoria: 'EPP', producto: 'RESPIRADOR MEDIO ROSTRO', talla: 'M', stock: 11 },
  { categoria: 'EPP', producto: 'RESPIRADOR MEDIO ROSTRO', talla: 'L', stock: 1 },

  { categoria: 'EPP', producto: 'GUANTES HYFLEX', talla: '8', stock: 9 },
  { categoria: 'EPP', producto: 'GUANTES HYFLEX', talla: '9', stock: 10 },
  { categoria: 'EPP', producto: 'GUANTES HYFLEX', talla: '10', stock: 5 },

  // ── EPP sin talla ─────────────────────────────────────────────
  { categoria: 'EPP', producto: 'AMORTIGUADOR DE CAIDA FLOYD (2-107-EST) TIPO Y SEGMA', talla: null, stock: 9 },
  { categoria: 'EPP', producto: 'ANTITRAUMA ASECUR SEGMA', talla: null, stock: 10 },
  { categoria: 'EPP', producto: 'ARNES RESCUE REDHAWK (6A) MULTITALLA SEGMA', talla: null, stock: 11 },
  { categoria: 'EPP', producto: 'BANANO PORTA RESPIRADOR', talla: null, stock: 4 },
  { categoria: 'EPP', producto: 'BARBIQUEJO PARA CASCO', talla: null, stock: 94 },
  { categoria: 'EPP', producto: 'CABO DE VIDA STONES (CINTA - 2EST - 107) KING 1,8 MTS SEGMA', talla: null, stock: 3 },
  { categoria: 'EPP', producto: 'CADENA PARA NEUMATICOS (KIT DE INVIERNO)', talla: null, stock: 3 },
  { categoria: 'EPP', producto: 'CAJA DE TAPONES AUDITIVOS', talla: null, stock: 90 },
  { categoria: 'EPP', producto: 'CASCO DE SEGURIDAD BLANCO MSA LOGO DRS', talla: null, stock: 48 },
  { categoria: 'EPP', producto: 'FILTRO PARTICULAS', talla: null, stock: 11 },
  { categoria: 'EPP', producto: 'FILTROS (PAR)', talla: null, stock: 7 },
  { categoria: 'EPP', producto: 'GUANTES CABRITILLA', talla: null, stock: 48 },
  { categoria: 'EPP', producto: 'LEGIONARIO', talla: null, stock: 111 },
  { categoria: 'EPP', producto: 'LENTES AVIADOR NEGRO', talla: null, stock: 10 },
  { categoria: 'EPP', producto: 'LENTES CLAROS', talla: null, stock: 51 },
  { categoria: 'EPP', producto: 'LENTES OSCURO', talla: null, stock: 20 },
  { categoria: 'EPP', producto: 'MUÑEQUERA PORTA HERRAMIENTA NEW SEGMA', talla: null, stock: 9 },
  { categoria: 'EPP', producto: 'PROTECTOR AUDITIVO PARA CASCOS', talla: null, stock: 35 },
  { categoria: 'EPP', producto: 'PROTECTOR LABIAL', talla: null, stock: 91 },
  { categoria: 'EPP', producto: 'PROTECTOR SOLAR UPF+50', talla: null, stock: 25 },
  { categoria: 'EPP', producto: 'PULPO PARA CADENAS NEUMATICOS (KIT DE INVIERNO)', talla: null, stock: 10 },
  { categoria: 'EPP', producto: 'RODILLERA', talla: null, stock: 3 },
  { categoria: 'EPP', producto: 'SOBRE LENTES CLAROS', talla: null, stock: 23 },
  { categoria: 'EPP', producto: 'SOBRE LENTES OSCUROS', talla: null, stock: 16 },

  // ── Artículos de Oficina ──────────────────────────────────────
  { categoria: 'Articulos De Oficina', producto: 'MOCHILAS', talla: null, stock: 24 },
  { categoria: 'Articulos De Oficina', producto: 'VASOS BLANCOS TERMICOS', talla: null, stock: 91 },
  { categoria: 'Articulos De Oficina', producto: 'MOUSE+TECLADO', talla: null, stock: 34 },
  { categoria: 'Articulos De Oficina', producto: 'SOPORTE PORTATIL', talla: null, stock: 39 },
  { categoria: 'Articulos De Oficina', producto: 'CINTA DE GAFETE', talla: null, stock: 45 },
  { categoria: 'Articulos De Oficina', producto: 'MUÑEQUERA MOUSE', talla: null, stock: 36 },
  { categoria: 'Articulos De Oficina', producto: 'MUÑEQUERA TECLADO', talla: null, stock: 42 },
  { categoria: 'Articulos De Oficina', producto: 'BOTELLA ROJA', talla: null, stock: 42 },
  { categoria: 'Articulos De Oficina', producto: 'PORTA RESPIRADOR ATOX', talla: null, stock: 25 },
];

async function seed() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const col = client.db('drsingenieria').collection('inventario');

    await col.deleteMany({});
    const result = await col.insertMany(productos);
    console.log(`\n✓ Insertados ${result.insertedCount} productos en la colección "inventario"\n`);

    const categorias = [...new Set(productos.map(p => p.categoria))];
    for (const cat of categorias) {
      const count = productos.filter(p => p.categoria === cat).length;
      console.log(`  ${cat}: ${count} registros`);
    }
    console.log('');
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
