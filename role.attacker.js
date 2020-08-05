module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // find closest hostile creep
        const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        // TODO: kill the healer first
        // TODO: sit in ramparts to defend
        if (target) {
            if(creep.attack(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            try {
                let username = target.owner.username;
                Game.notify(`User ${username} spotted in room ${target.room}`);
            } catch(error) {
                console.log("caught an error trying to notify about a user attacking");
                console.error(error);
            }
        }
        // if in target room
     }
};
