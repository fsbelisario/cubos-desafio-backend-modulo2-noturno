const fs = require("fs/promises");
const { readFile, writeFile } = require('../fs-lib');
const { validateProductInputs,
    validateProductInCart,
    validateProductInStock,
    validateProductAvailability,
    validateCartQuantity,
    updateCart,
    validateUserData
} = require('./validations')

const listProductsInShoppingCart = async (req, res) => {
    //Lê base de dados
    const dataFromFile = await readFile();
    const shoppingCartList = dataFromFile.carrinho;
    res.status(200).json(shoppingCartList);
};

const addProductToShoppingCart = async (req, res) => {
    //Valida dados de entrada (dados do produto)
    let error = validateProductInputs(req.body, "add");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Lê base de dados
    let dataFromFile = await readFile();
    let productList = dataFromFile.produtos;
    let shoppingCartList = dataFromFile.carrinho;

    //Identifica posição do produto no carrinho
    let productPositionCart = shoppingCartList.produtos.findIndex(product => product.id === parseInt(req.body.id));

    //Verifica se o produto indicado se encontra no carrinho
    error = validateProductInCart(productPositionCart, req.body.id, "add");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Identifica posição no estoque do produto a ser adicionado
    let productPosition = productList.findIndex(product => product.id === parseInt(req.body.id));

    //Verifica se o produto indicado existe no estoque
    error = validateProductInStock(productPosition, req.body.id);
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    const valueDifference = productList[productPosition].preco * parseInt(req.body.quantidade);

    //Valida estoque do produto a ser adicionado
    error = validateProductAvailability(productList[productPosition].estoque, parseInt(req.body.quantidade), productList[productPosition].nome, "add");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Atualiza o carrinho
    dataFromFile = updateCart(dataFromFile, productPosition, 0, parseInt(req.body.quantidade), valueDifference, "add");

    //Atualiza base de dados
    await writeFile(dataFromFile);

    res.status(200).json(shoppingCartList);
};

const editProductInShoppingCart = async (req, res) => {
    //Valida dados de entrada (dados do produto)
    let error = validateProductInputs({
        id: req.params.idProduto,
        quantidade: req.body.quantidade
    }, "edit");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Lê base de dados
    let dataFromFile = await readFile();
    let productList = dataFromFile.produtos;
    let shoppingCartList = dataFromFile.carrinho;

    //Identifica a posição do produto indicado no carrinho
    let productPositionCart = shoppingCartList.produtos.findIndex(product => product.id === parseInt(req.params.idProduto));

    //Verifica se o produto indicado se encontra no carrinho
    error = validateProductInCart(productPositionCart, req.params.idProduto, "edit");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Identifica a posição do produto indicado no estoque
    let productPosition = productList.findIndex(product => product.id === parseInt(req.params.idProduto));

    const finalCartQuantity = shoppingCartList.produtos[productPositionCart].quantidade + parseInt(req.body.quantidade);
    const valueDifference = productList[productPosition].preco * parseInt(req.body.quantidade);

    //Valida quantidade a ser ajustada
    error = validateCartQuantity(finalCartQuantity);
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Valida estoque do produto a ser adicionado
    error = validateProductAvailability(productList[productPosition].estoque, finalCartQuantity, productList[productPosition].nome, "edit");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Atualiza carrinho
    dataFromFile = updateCart(dataFromFile, productPosition, productPositionCart, finalCartQuantity, valueDifference, "edit");

    //Atualiza base de dados
    await writeFile(dataFromFile);

    res.status(200).json(shoppingCartList);
};

const deleteProductFromShoppingCart = async (req, res) => {
    //Valida dados de entrada (dados do produto)
    let error = validateProductInputs({
        id: req.params.idProduto
    }, "delete");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Lê base de dados
    let dataFromFile = await readFile();
    let productList = dataFromFile.produtos;
    let shoppingCartList = dataFromFile.carrinho;

    //Identifica a posição do produto indicado no carrinho
    let productPositionCart = shoppingCartList.produtos.findIndex(product => product.id === parseInt(req.params.idProduto));

    //Verifica se o produto indicado se encontra no carrinho
    error = validateProductInCart(productPositionCart, req.params.idProduto, "delete");
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Identifica a posição do produto indicado no estoque
    let productPosition = productList.findIndex(product => product.id === parseInt(req.params.idProduto));

    const cartQuantity = shoppingCartList.produtos[productPositionCart].quantidade;
    const finalStockQuantity = productList[productPosition].estoque + cartQuantity;
    const valueDifference = productList[productPosition].preco * -cartQuantity;

    //Atualiza carrinho
    dataFromFile = updateCart(dataFromFile, productPosition, productPositionCart, 0, valueDifference, "delete");

    //Atualiza base de dados
    await writeFile(dataFromFile);

    res.status(200).json(shoppingCartList);
};

const clearShoppingCart = async (req, res) => {
    //Lê base de dados
    const dataFromFile = await readFile();
    let shoppingCartList = dataFromFile.carrinho;

    //Limpa carrinho
    shoppingCartList.produtos = [];
    shoppingCartList.dataDeEntrega = null;
    shoppingCartList.subtotal = 0;
    shoppingCartList.valorDoFrete = 0;
    shoppingCartList.totalAPagar = 0;

    //Atualiza base de dados
    await writeFile(dataFromFile);

    res.status(200).json({ message: "Carrinho esvaziado com sucesso." });
};

const checkOutShoppingCart = async (req, res) => {
    //Lê base de dados
    const dataFromFile = await readFile();
    let productList = dataFromFile.produtos;
    let shoppingCartList = dataFromFile.carrinho;

    //Verifica se carrinho está vazio
    if (shoppingCartList.produtos.length === 0) {
        res.status(400).json({ message: "O carrinho está vazio." });
    }

    let insufficientStock = "";
    for (let productPositionCart = 0; productPositionCart < shoppingCartList.produtos.length; productPositionCart++) {
        //Identifica a posição do produto no estoque
        let productPosition = productList.findIndex(product => product.id === shoppingCartList.produtos[productPositionCart].id);

        //Verifica se produto continua com estoque disponível
        let error = validateProductAvailability(productList[productPosition].estoque, shoppingCartList.produtos[productPositionCart].quantidade, productList[productPosition].nome, "check-out");
        if (error) {
            if (insufficientStock.length === 0) {
                insufficientStock = `Os produtos a seguir não possuem estoque suficiente: ${error}`;
            } else {
                insufficientStock += ` | ${error}`;
            }

        }
    }

    if (insufficientStock.length > 0) {
        res.status(400).json(insufficientStock);
        return;
    }

    //Valida dados de entrada (dados de usuário)
    error = validateUserData(req.body.customer);
    if (error) {
        res.status(400).json({ message: error });
        return;
    }

    //Atualiza estoque
    for (let productPositionCart = 0; productPositionCart < shoppingCartList.produtos.length; productPositionCart++) {
        //Identifica a posição do produto no estoque
        let productPosition = productList.findIndex(product => product.id === shoppingCartList.produtos[productPositionCart].id);

        //Abate item vendido do estoque
        const cartQuantity = shoppingCartList.produtos[productPositionCart].quantidade;
        productList[productPosition].estoque -= cartQuantity;
    }

    //Registra estado atual do carrinho para apresentação ao final da operação
    let cartReport = {
        "mensagem": "Compra finalizada com sucesso.",
        "carrinho": {
            "produtos": shoppingCartList.produtos,
            "subtotal": shoppingCartList.subtotal,
            "dataDeEntrega": shoppingCartList.dataDeEntrega,
            "valorDoFrete": shoppingCartList.valorDoFrete,
            "totalAPagar": shoppingCartList.totalAPagar
        }
    };

    //Limpa carrinho
    shoppingCartList.produtos = [];
    shoppingCartList.dataDeEntrega = null;
    shoppingCartList.subtotal = 0;
    shoppingCartList.valorDoFrete = 0;
    shoppingCartList.totalAPagar = 0;

    //Atualiza base de dados
    await writeFile(dataFromFile);

    res.status(200).json(cartReport);
};

module.exports = {
    listProductsInShoppingCart,
    addProductToShoppingCart,
    editProductInShoppingCart,
    deleteProductFromShoppingCart,
    clearShoppingCart,
    checkOutShoppingCart
};