module.exports = {
    attributes : {
        "name" : "text",
        "age" : "number",
        "kind" : "text"
    },
    hasMany : {
        "manyrm" : "person"
    },
    hasOne : {
        "onerm" : "person1",
    }
}; 