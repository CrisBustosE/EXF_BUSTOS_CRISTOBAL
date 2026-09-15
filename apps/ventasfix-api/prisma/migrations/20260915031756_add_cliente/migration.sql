-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rut_empresa" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "nombre_contacto" TEXT NOT NULL,
    "email_contacto" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_rut_empresa_key" ON "Cliente"("rut_empresa");
