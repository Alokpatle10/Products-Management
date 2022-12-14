const mongoose = require("mongoose")
const productModel = require("../model/productModel")
const cartModel = require("../model/cartModel")
const userModel = require("../model/userModel")

const { isValidObjectId } = require("../validation/validator")



const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const { cartId, productId } = req.body
        //-------------------------------------checking user------------------------------------------//
        if (!userId || !isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }
        const checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "user not found" })
        }
        //-------------------------------------checking product------------------------------------------//
        if (!productId || !isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide a valid productId." }) }
        const checkProduct = await productModel.findById(productId)
        if (checkProduct == null || checkProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Product not found or it may be deleted" })
        }
        //-------------------------------------------------------------------------------------------//
        let itemForAdd = {
            "productId": productId,
            "quantity": 1
        }

        if (cartId) {
            //-------------------------------------checking cart------------------------------------------//
            if (!isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide a valid cartId." }) }
            const checkCart = await cartModel.findById(cartId)
            if (checkCart == null || checkCart.isDeleted == true) {
                return res.status(404).send({ status: false, message: "cart not found or it may be deleted" })
            }
            //-------------------------------------------------------------------------------------------//
            let arr = checkCart.items

            for (let i = 0; i < arr.length; i++) {
                if (arr[i].productId == itemForAdd.productId) {
                    arr[i].quantity = arr[i].quantity + itemForAdd.quantity;
                    break
                }
                else if (i == (arr.length - 1)) {
                    arr.push(itemForAdd)
                    break
                }
            }
            /////this is for when items array is empty i.e. items.length=0
            if (checkCart.items.length == 0) {
                arr.push(itemForAdd)
            }
            const dataForUpdate = {
                "userId": userId,
                "items": arr,
                "totalPrice": checkProduct.price + checkCart.totalPrice,
                "totalItems": arr.length
            }
            const updateCard = await cartModel.findByIdAndUpdate(
                { "_id": cartId },
                { $set: dataForUpdate },
                { new: true }
            ).populate("items.productId", ("price title description productImage availableSizes"))
            return res.status(201).send({ status: true, message: "Success", data: updateCard })

        }
        else {
            const checkCart = await cartModel.findOne({ "userId": userId })
            if (checkCart) {
                return res.status(400).send({ status: false, message: "A cart with this userId already present try to edit that cart" })
            }

            const dataForCreate = {
                "userId": userId,
                "items": [itemForAdd],
                "totalPrice": checkProduct.price,
                "totalItems": 1
            }
            const createCart1 = await cartModel.create(dataForCreate)



            return res.status(201).send({ status: true, message: "Success", data: createCart1 })

        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const updateCart = async function (req, res) {////negeative number ,,,price
    try {
        const userId = req.params.userId
        const { productId, cartId, removeProduct } = req.body
        //-------------------------------------checking user------------------------------------------//
        if (!userId || !isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }



        //-------------------------------------checking cart------------------------------------------//

        if (!cartId || !isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide a valid cartId." }) }
        const checkCart = await cartModel.findOne({ "_id": cartId, "userId": userId })
        if (checkCart == null || checkCart.isDeleted == true) {
            return res.status(404).send({ status: false, message: "cart not found either it may be deleted or there is conflict(check userId and cartId are from the same document or not)" })
        }

        //-------------------------------------checking product------------------------------------------//
        if (!productId || !isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide a valid productId." }) }
        const checkProduct = await productModel.findById(productId)
        if (checkProduct == null || checkProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Product not found or it may be deleted" })
        }

        if (!/^[0-9]\d*$/g.test(removeProduct)) {
            { return res.status(400).send({ status: false, message: "Please provide a valid value for removeProduct key." }) }
        }
        //-----------------------------------------------------------------------------------------------//
        let arr = checkCart.items
        if(arr.length==0) return res.status(400).send({status:false,message:"No items present in the cart"})
        let quantity = 0
        let finalPrice = checkCart.totalPrice
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].productId == productId) {
                quantity = arr[i].quantity //assigning value to quantity
                if (removeProduct == 0 || (removeProduct - quantity == 0)) {
                    finalPrice = finalPrice - (quantity * checkProduct.price)
                    arr.splice(i, 1)
                    break
                }
                else if (quantity >= removeProduct) {
                    arr[i].quantity = quantity - removeProduct;
                    finalPrice = finalPrice - checkProduct.price
                    break
                }
                else if (quantity < removeProduct) {
                    return res.status(400).send({ status: false, message: "removeProduct value cannot greater than available quantity" })
                }

            }
            else if (i == (arr.length - 1)) {
                return res.status(400).send({ status: false, message: "No product found with this productId in cart" })
            }
        }

        const dataForUpdation = {
            "userId": userId,
            "items": arr,
            "totalPrice": finalPrice,
            "totalItems": arr.length//
        }
        const updateCard = await cartModel.findByIdAndUpdate(
            { "_id": cartId },
            { $set: dataForUpdation },
            { new: true }
        ).populate("items.productId", ("price title description productImage availableSizes"))
        return res.status(200).send({ status: true, message: "Success", data: updateCard })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!userId || !isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }
        let user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, message: "this user doesnot exists" }) }
        let cart = await cartModel.findOne({ "userId": userId }).populate("items.productId", ("price title description productImage availableSizes"))
        if (!cart) { return res.status(400).send({ status: false, message: "this user doesnot have any cart exists" }) }
        return res.status(200).send({ status: true, message: "Success", data: cart })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!userId || !isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) };

        const userExist = await userModel.findById(userId)
        if (!userExist) return res.status(404).send({ status: false, message: "user not found" })

        let cartExist = await cartModel.findOne({ "userId": userId })
        if (!cartExist) return res.status(404).send({ status: false, message: "this user dont have any cart" })

        let cart = await cartModel.findByIdAndUpdate(
            cartExist._id,
            { $set: { items: [], totalItems: 0, totalPrice: 0 } },
            { new: true })
        return res.status(204).send({ status: true, message: "CART DELETED SUCESSFULLY", data: cart })
    } catch (error) {
        return res.status(500).send({ status: false, err: error.message })
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }   