const { addBusinessDays } = require("date-fns");

function validateProductInputs(product, operation) {
    //Valida ID do produto
    if (product.id === undefined) {
        return "É necessário informar o ID do produto.";
    }
    if (!Number.isInteger(parseInt(product.id))) {
        return "O ID do produto deve ser um número inteiro.";
    }

    //Valida quantidade do produto
    if (product.quantidade === undefined && operation !== "delete") {
        return "É necessário informar a quantidade do produto.";
    }
    if (operation === "add") {
        if (parseInt(product.quantidade) <= 0 || !Number.isInteger(parseInt(product.quantidade))) {
            return "A quantidade do produto deve ser um número inteiro e positivo.";
        }
    } else if (operation === "edit") {
        if (parseInt(product.quantidade) === 0 || !Number.isInteger(parseInt(product.quantidade))) {
            return "A quantidade do produto deve ser um número inteiro diferente de zero.";
        }
    }
}

function validateProductInCart(productPositionCart, productId, operation) {
    if (operation === "add") {
        if (productPositionCart !== -1) {
            return `O produto com ID ${productId} já se encontra no carrinho. Utilizar a função de editar quantidades.`;
        }
    } else {
        if (productPositionCart === -1) {
            return `O produto com ID ${productId} não se encontra no carrinho.`;
        }
    }

}

function validateProductInStock(productPosition, productId) {
    if (productPosition === -1) {
        return `Não foi encontrato produto com o ID ${productId} no estoque.`;
    }
}

function validateProductAvailability(stockQuantity, cartQuantity, productName, operation) {
    if ((stockQuantity - cartQuantity) < 0) {
        if (operation !== "check-out") {
            return `O produto <${productName}> não possui estoque suficiente.`;
        } else {
            return `${productName} - Estoque: ${stockQuantity} - Qtd. solicitada: ${cartQuantity}.`;
        }
    }
}

function validateCartQuantity(finalCartQuantity) {
    if (finalCartQuantity < 0) {
        return "A quantidade a remover do produto é superior à quantidade atual no carrinho.";
    }
}

function updateCart(dataFromFile, productPosition, productPositionCart, finalCartQuantity, valueDifference, operation) {
    let productList = dataFromFile.produtos;
    let shoppingCartList = dataFromFile.carrinho;
    if (operation === "add") {
        //Adiciona o produto
        shoppingCartList.produtos.push({
            "id": productList[productPosition].id,
            "quantidade": finalCartQuantity,
            "nome": productList[productPosition].nome,
            "preco": productList[productPosition].preco,
            "categoria": productList[productPosition].categoria
        });
    } else {
        if (finalCartQuantity === 0) {
            shoppingCartList.produtos.splice(productPositionCart, 1); //Remove o produto
        } else {
            shoppingCartList.produtos[productPositionCart].quantidade = finalCartQuantity;//Atualiza a quantidade do produto
        }
    }

    if (shoppingCartList.produtos.length === 0) {
        shoppingCartList.dataDeEntrega = null;
        shoppingCartList.subtotal = 0;
        shoppingCartList.valorDoFrete = 0;
        shoppingCartList.totalAPagar = 0;
    } else {
        shoppingCartList.dataDeEntrega = addBusinessDays(new Date(), 15);
        shoppingCartList.subtotal += valueDifference;
        shoppingCartList.valorDoFrete = shoppingCartList.subtotal <= 20000 ? 5000 : 0;
        shoppingCartList.totalAPagar = (shoppingCartList.subtotal + shoppingCartList.valorDoFrete);
    }
    return dataFromFile;
}

function validateUserData(userData) {
    //Valida tipo de cliente
    if (userData.type === undefined) {
        return "É necessário informar o tipo de cliente.";
    }
    if (userData.type !== "individual") {
        return "O tipo deve ser <individual> (este e-commerce só atende pessoas físicas.";
    }

    //Valida sigla do país
    if (userData.country === undefined) {
        return "É necessário informar o país.";
    }
    if (userData.country.length !== 2) {
        return "O país deve ter 2 caracteres.";
    }

    //Valida nome do usuário
    if (userData.name === undefined) {
        return "É necessário informar o nome e sobrenome do cliente.";
    }
    if (userData.name.split(" ").length < 2) {
        return "O cliente deve informar nome e sobrenome.";
    }

    //Valida tipo do documento
    if (userData.documents[0].type === undefined) {
        return "É necessário informar o tipo do documento.";
    }
    if (userData.documents[0].type !== "cpf") {
        return "O tipo de documento deve ser <cpf> (este e-commerce só atende pessoas físicas.";
    }

    //Valida documento
    if (userData.documents[0].number === undefined) {
        return "É necessário informar o número do documento.";
    }
    if (userData.documents[0].number.length !== 11) {
        return "O documento deve conter 11 dígitos numéricos.";
    }
    if (!Number.isInteger(parseInt(userData.documents[0].number))) {
        return "O documento deve conter 11 dígitos numéricos.";
    }
}

module.exports = {
    validateProductInputs,
    validateProductInCart,
    validateProductInStock,
    validateProductAvailability,
    validateCartQuantity,
    updateCart,
    validateUserData
};