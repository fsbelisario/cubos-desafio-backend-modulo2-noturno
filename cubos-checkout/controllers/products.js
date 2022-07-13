const fs = require("fs/promises");
const { readFile } = require('../fs-lib');

const listProducts = async (req, res) => {
    //Valida dados de entrada
    const categoryFilter = req.query.categoria;
    let bottomPriceFilter = req.query.precoInicial;
    let topPriceFilter = req.query.precoFinal;

    if (bottomPriceFilter !== "" && !Number.isInteger(parseInt(bottomPriceFilter))) {
        res.status(400).json({ message: "O preço limite inferior deve ser informado em centavos (número inteiro)." });
        return;
    };

    if (topPriceFilter !== "" && !Number.isInteger(parseInt(topPriceFilter))) {
        res.status(400).json({ message: "O preço limite superior deve ser informado em centavos (número inteiro)." });
        return;
    };

    //Lê base de dados
    const dataFromFile = await readFile();
    let productList = dataFromFile.produtos;

    //Filtra produtos em estoque
    if (categoryFilter !== "") {
        productList = productList.filter((product) => {
            return product.estoque > 0;
        });
    }

    //Filtra produtos da categoria esoecificada
    if (categoryFilter !== "") {
        productList = productList.filter((product) => {
            return product.categoria === categoryFilter;
        });
    }

    //Filtra produtos acima do preço mínmimo especificado
    if (bottomPriceFilter !== "") {
        bottomPriceFilter = parseInt(bottomPriceFilter);
        productList = productList.filter((product) => {
            return product.preco >= bottomPriceFilter;
        });
    }

    //Filtra produtos abaixo do preço máximo especificado
    if (topPriceFilter !== "") {
        topPriceFilter = parseInt(topPriceFilter);
        productList = productList.filter((product) => {
            return product.preco <= topPriceFilter;
        });
    }

    //Verifica se existem produtos que correspondem aos filtros aplicados
    if (productList.length === 0) {
        res.status(400).json({ message: "Não existem produtos disponíveis que correspondam aos filtros aplicados." });
        return;
    }

    res.status(200).json(productList);
};

module.exports = { listProducts };