module.exports = {
    attributes: {
        "name": "text",
        "surname": "text",
        "age": "number",
        "weight": "number"
    },
    hasOne: {'one': "person1"},
    hasMany: {'many': "car"}
};