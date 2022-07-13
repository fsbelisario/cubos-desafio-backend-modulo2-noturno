const express = require("express");
const router = express();
const { listProducts } = require("./controllers/products");
const {
    listProductsInShoppingCart,
    addProductToShoppingCart,
    editProductInShoppingCart,
    deleteProductFromShoppingCart,
    clearShoppingCart,
    checkOutShoppingCart
} = require("./controllers/shopping-cart");

router.get("/produtos", listProducts); //Listar produtos em estoque conforme filtros
router.get("/carrinho", listProductsInShoppingCart); //Listar produtos no carrinho
router.post("/carrinho/produtos", addProductToShoppingCart); //Incluir produto no carrinho
router.patch("/carrinho/produtos/:idProduto", editProductInShoppingCart); //Editar produto no carrinho
router.delete("/carrinho/produtos/:idProduto", deleteProductFromShoppingCart); //Remover produto do carrinho
router.delete("/carrinho", clearShoppingCart); //Esvaziar carrinho
router.post("/carrinho/finalizar-compra", checkOutShoppingCart); //Finalizar compra

module.exports = router;