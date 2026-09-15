import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { isValidRut, normalizeRut } from "../src/lib/rut";

const prisma = new PrismaClient();

// precio_de_venta = precio_neto + IVA 19% fijo (enunciado original del
// examen), mismo cálculo que createProducto/updateProducto en
// src/lib/productos.ts — no es un valor a mano.
function precioConIva(precioNeto: number): number {
  return Math.round(precioNeto * 1.19);
}

function rut(raw: string): string {
  if (!isValidRut(raw)) throw new Error(`RUT inválido en seed: ${raw}`);
  return normalizeRut(raw) as string;
}

async function seedUsuarios() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ventasfix.cl";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const adminRut = process.env.ADMIN_RUT ?? "11111111-1";

  const usuarios = [
    { rut: adminRut, nombre: "Admin", apellido: "VentasFix", email: adminEmail, password: adminPassword },
    {
      rut: "15678234-3",
      nombre: "María",
      apellido: "González",
      email: "maria.gonzalez@ventasfix.cl",
      password: "Usuario123!",
    },
    {
      rut: "18234567-9",
      nombre: "Pedro",
      apellido: "Rodríguez",
      email: "pedro.rodriguez@ventasfix.cl",
      password: "Usuario123!",
    },
  ];

  for (const usuario of usuarios) {
    const password = await argon2.hash(usuario.password);
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: { rut: rut(usuario.rut), nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, password },
    });
  }

  console.log(`Usuarios listos: ${usuarios.map((u) => u.email).join(", ")}`);
}

async function seedProductos() {
  const placeholder = "/placeholder-producto.svg";

  const productos = [
    {
      sku: "MOU-LOG-M170",
      nombre: "Mouse Inalámbrico Logitech M170",
      descripcion_corta: "Mouse óptico inalámbrico, receptor USB 2.4GHz",
      descripcion_larga:
        "Mouse inalámbrico compacto con seguimiento óptico de 1000 DPI, hasta 12 meses de autonomía con una sola pila AA. Ideal para uso de oficina diario.",
      precio_neto: 8500,
      stock_actual: 3,
      stock_minimo: 5,
      stock_bajo: 5,
      stock_alto: 30,
      imagen_del_producto: placeholder, // stock bajo → producto con imagen de ejemplo
    },
    {
      sku: "TEC-RED-K552",
      nombre: "Teclado Mecánico Redragon K552",
      descripcion_corta: "Teclado mecánico gamer, switches azules, retroiluminado",
      descripcion_larga:
        "Teclado mecánico compacto (87 teclas) con switches azules táctiles, retroiluminación LED roja y carcasa de aluminio cepillado.",
      precio_neto: 24990,
      stock_actual: 25,
      stock_minimo: 8,
      stock_bajo: 5,
      stock_alto: 40,
      imagen_del_producto: null,
    },
    {
      sku: "MON-SAM-24LED",
      nombre: "Monitor LED 24\" Samsung Full HD",
      descripcion_corta: "Monitor 24 pulgadas, Full HD 1920x1080, panel VA",
      descripcion_larga:
        "Monitor de 24 pulgadas con panel VA Full HD, 75Hz de refresco y modo Eye Saver para reducir la fatiga visual en jornadas largas.",
      precio_neto: 89990,
      stock_actual: 15,
      stock_minimo: 4,
      stock_bajo: 3,
      stock_alto: 25,
      imagen_del_producto: null,
    },
    {
      sku: "CAB-HDMI-2M",
      nombre: "Cable HDMI 2.0 2 metros",
      descripcion_corta: "Cable HDMI 2.0, soporta 4K a 60Hz",
      descripcion_larga: "Cable HDMI 2.0 de 2 metros con conectores dorados, compatible con resoluciones hasta 4K a 60Hz y Ethernet.",
      precio_neto: 3990,
      stock_actual: 80,
      stock_minimo: 10,
      stock_bajo: 5,
      stock_alto: 50,
      imagen_del_producto: null,
    },
    {
      sku: "AUD-JBL-510BT",
      nombre: "Audífonos Bluetooth JBL Tune 510BT",
      descripcion_corta: "Audífonos over-ear inalámbricos, hasta 40h de batería",
      descripcion_larga:
        "Audífonos inalámbricos over-ear con sonido JBL Pure Bass, hasta 40 horas de reproducción y controles multifunción en el auricular.",
      precio_neto: 29990,
      stock_actual: 60,
      stock_minimo: 8,
      stock_bajo: 5,
      stock_alto: 40,
      imagen_del_producto: null,
    },
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { sku: producto.sku },
      update: {},
      create: { ...producto, precio_de_venta: precioConIva(producto.precio_neto) },
    });
  }

  console.log(`Productos listos: ${productos.map((p) => p.sku).join(", ")}`);
}

async function seedClientes() {
  const clientes = [
    {
      rut_empresa: "76543210-3",
      rubro: "Electrónica y Tecnología",
      razon_social: "Distribuidora ElectroSur SpA",
      telefono: "+56 2 2345 6789",
      direccion: "Av. Providencia 1234, Providencia, Santiago",
      nombre_contacto: "Francisca Muñoz",
      email_contacto: "contacto@electrosur.cl",
    },
    {
      rut_empresa: "77234567-4",
      rubro: "Retail",
      razon_social: "Comercial Andes Limitada",
      telefono: "+56 2 2987 6543",
      direccion: "Los Militares 5620, Las Condes, Santiago",
      nombre_contacto: "Ignacio Torres",
      email_contacto: "ventas@comercialandes.cl",
    },
    {
      rut_empresa: "78123456-7",
      rubro: "Ferretería y Construcción",
      razon_social: "Ferretería Los Pinos EIRL",
      telefono: "+56 41 234 5678",
      direccion: "Avenida Alemania 890, Concepción",
      nombre_contacto: "Carlos Fuentes",
      email_contacto: "carlos@ferreterialospinos.cl",
    },
    {
      rut_empresa: "96789123-1",
      rubro: "Importación y Distribución",
      razon_social: "Importadora Pacífico S.A.",
      telefono: "+56 32 245 6712",
      direccion: "Blanco 456, Valparaíso",
      nombre_contacto: "Valentina Rojas",
      email_contacto: "vrojas@importadorapacifico.cl",
    },
  ];

  for (const cliente of clientes) {
    await prisma.cliente.upsert({
      where: { rut_empresa: rut(cliente.rut_empresa) },
      update: {},
      create: { ...cliente, rut_empresa: rut(cliente.rut_empresa) },
    });
  }

  console.log(`Clientes listos: ${clientes.map((c) => c.razon_social).join(", ")}`);
}

async function main() {
  await seedUsuarios();
  await seedProductos();
  await seedClientes();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
