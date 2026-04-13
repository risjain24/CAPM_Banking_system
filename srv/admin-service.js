const cds = require("@sap/cds");

module.exports = class AdminService extends cds.ApplicationService {
    async init() {
        await super.init();
    }
};