module.exports = {
    attributes: {
        "name": "text",
        "age": "number",
        "kind": "text"
    },
    hasMany: {
        "many":"person"
    }
//    hasOne: {
//        model: "person",
//        reverse: "car"
//    }
};