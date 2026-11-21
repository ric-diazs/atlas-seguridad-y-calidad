
/*
// Datos de prueba

- cliente_id: 1,
- titulo: Contrato CP-35,
- descripcion: Contrato CP-35 de cliente 1
- fecha_inicio: "2026-11-08"
- 2026-12-07
- file.pdf (tipo "File")
*/

// TEST SUBIDA DE ARCHIVO
pm.test("La descarga responde 200", function () {
  pm.response.to.have.status(200);
});

pm.test("La descarga tarda como máximo 10 segundos", function () {
  pm.expect(pm.response.responseTime).to.be.at.most(10000);
});

// TEST SUBIDA DE ARCHIVO
pm.test("La subida responde 201", function () {
  pm.response.to.have.status(201);
});

pm.test("La subida tarda como máximo 10 segundos", function () {
  pm.expect(pm.response.responseTime).to.be.at.most(10000);
});
