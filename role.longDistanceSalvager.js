module.exports = {
    run: function(creep) {

        //creep.buildRoad();

        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && _.sum(creep.store) == 0) {
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && _.sum(creep.store) == creep.store.getCapacity() ) {
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            // if in home room
            if (creep.room.name == creep.memory.home) {
                creep.unload();
            }
            // if not in home room...
            else {
                // find exit to home room
                let exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            // if in target room
            if (creep.room.name == creep.memory.target) {
                creep.getSalvage();
            }
            // if not in target room
            else {
                // find exit to target room
                let exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
        }
    }
};
