module.exports = {
    attributes: {
        "name": "text",
        "surname": "text",
        "age": "number"
    },
    db: "default1",
    hasOne: {
        "car": "car",
        "pet": {
            model: "pet",
            reverse: "owner"
        }
    }
}