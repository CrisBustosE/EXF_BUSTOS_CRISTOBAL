export type EstadoStock = "bajo" | "normal" | "alto";

export type ProductoRow = {
  id: number;
  sku: string;
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string | null;
  imagen_del_producto: string | null;
  precio_neto: number;
  precio_de_venta: number;
  stock_actual: number;
  stock_minimo: number;
  stock_bajo: number;
  stock_alto: number;
  estado_stock: EstadoStock;
};
