var roleUpgrader = require('role.upgrader');
// role hauler
module.exports = {
    run: function(creep) {

        creep.buildRoad();

        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && _.sum(creep.store) == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && _.sum(creep.store) == creep.store.getCapacity() ) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            creep.unload();
        }
        // if creep is supposed to get energy
        else {
            creep.haulResources();
        }
    }
};
