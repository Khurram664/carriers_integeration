const { DID_Group, Number_Inventory, Customer, Carrier } = require("../utils/sequelize_db.js");

const getNumbers = async (req, res) => {

    const { id } = req.params;

    try {
        const numbers = await Number_Inventory.findAll({
            where: {
                group_id: id
            },
            include: [
                { model: Customer },
                { model: Carrier }
            ]
        });
        res.status(200).send(numbers);
    } catch (error) {
        console.error(error)
    }

}

const getDIDGroups = async (req, res) => {

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;

    try {
        const count = await DID_Group.count();
        const didgroups = await DID_Group.findAll({
            include: [{
                model: Customer,
            }],
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ],
        });
        res.status(200).send({
            total_count: count,
            data: didgroups
        });
    } catch (error) {
        console.error(error)
    }

}

const addGroup = async (req, res) => {

    let params = req.body;
    try {

        let customer_id = params.customer_id;
        let did_group_id = await DID_Group.max('group_id', { where: { customer_id: customer_id } });

        if (Number.isInteger(did_group_id))
            did_group_id++;
        else
            did_group_id = customer_id * 1000;

        params.group_id = did_group_id;

        const did_group = await DID_Group.create(params);

        res.status(200).send({
            message: "Group created Successfully",
            data: did_group
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}

const getGroup = async (req, res) => {
    let params = req.body;

    const { id } = req.params;

    try {

        const did_group = await DID_Group.findAll({ where: { group_id: id } });

        res.status(200).send({
            data: did_group
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}

const getGroupAgainstCustomer = async (req, res) => {

    let params = req.body;

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;

    const { id } = req.params;



    try {
        const count = await Number_Inventory.count({
            where: { customer_id: id }
        });
        const did_groups = await DID_Group.findAll({
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ],
            where: { customer_id: id }
        });
        res.status(200).send({
            total_count: count,
            data: did_groups
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}



const getNumberAgainstGroup = async (req, res) => {
    let params = req.body;

    const { id } = req.params;

    let { limit, offset } = req.query;

    if (limit == undefined)
        limit = 10;

    if (offset == undefined)
        offset = 0;


    try {

        const count = await Number_Inventory.count({
            where: {
                group_id: id
            }
        });
        const numbers = await Number_Inventory.findAll({
            where: {
                group_id: id
            },
            include: [
                { model: Customer },
                { model: Carrier }
            ],
            offset: offset,
            limit: limit,
            order: [
                ['updated_at', 'DESC'],
            ]
        });

        res.status(200).send({
            total_count: count,
            data: numbers
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}


const editGroup = async (req, res) => {

    let params = req.body;

    try {

        const edit_did_group = await DID_Group.update(params, { where: { group_id: parseInt(req.params.id) } });

        console.log(edit_did_group);

        res.status(200).send({
            message: "Group edited Successfully",
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}

const assignCustomer = async (req, res) => {

    let params = req.body;

    let group_id = params.group_id;
    let customer_id = params.customer_id;


    try {

        const edit_did_group = await DID_Group.update({ customer_id: customer_id }, { where: { group_id: parseInt(group_id) } });

        res.status(200).send({
            message: "Group assigned to customer Successfully",
        });

    } catch (error) {
        console.error(error)
        res.status(500).send("Something went wrong")
    }
}


module.exports = {
    getNumbers,
    getDIDGroups,
    addGroup,
    getGroup,
    editGroup,
    getNumberAgainstGroup,
    getGroupAgainstCustomer,
    assignCustomer
}