module.exports = {
    attributes: {
        "name": "text",
        "surname": "text",
        "age": "number"
    }
    ,
    hasMany: {"many":"car"}
//    hasMany: {
//        model: "car"
//        ,
//        reverse: "owner"
//    }
};