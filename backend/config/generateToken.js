const jwb = require('jsonwebtoken');

const generateToken = (id) => {
    return jwb.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    });
}

module.exports = generateToken;

