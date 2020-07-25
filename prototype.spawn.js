var listOfRoles = ['harvester', 'miner', 'hauler', 'upgrader', 'fixer', 'builder'];

// create a new function for StructureSpawn
StructureSpawn.prototype.spawnCreepsIfNecessary =
    function () {
        let room = this.room;

        // init creep count defaults if they're not set
        for (let role of listOfRoles) {
            if (this.memory.minCreeps[role] == undefined) {
              //console.log(room.name + " don't know shit about " + role);
            }
        }

        // find all creeps in room
        let creepsInRoom = room.find(FIND_MY_CREEPS);

        // count the number of creeps alive for each role in this room
        let numberOfCreeps = {};
        for (let role of listOfRoles) {
            numberOfCreeps[role] = _.sum(creepsInRoom, (c) => c.memory.role == role);
        }
        let maxEnergy = room.energyCapacityAvailable;
        let currentEnergy = room.energyAvailable;
        let name = undefined;

        // if no harvesters are left AND either no miners or no hauler are left
        //  create a backup creep
        if (numberOfCreeps['harvester'] == 0 && numberOfCreeps['hauler'] == 0) {
            this.memory.backup_needed = true;
            // if there are still miners or enough energy in Storage left
            if (numberOfCreeps['miner'] > 0 ||
                (room.storage != undefined && room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
                console.log("No harvesters or haulers, but we have a miner or some stored energy, so creating a hauler");
                name = this.createHauler(150);
            }
            // if there is no miner and not enough energy in Storage left
            else {
                console.log("No harvester, haulers, miners, or stored energy. Created a harvester");
                name = this.createCustomCreep(room.energyAvailable, 'harvester');
            }
        }
        // if no backup creep is required
        else {
            this.memory.backup_needed = false;
            // check if all sources have miners
            let sources = room.find(FIND_SOURCES);
            for (let source of sources) {
                // if the source has no miner
                if (!_.some(creepsInRoom, c => c.memory.role == 'miner' && c.memory.sourceId == source.id)) {
                    // check whether or not the source has a container
                    let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    });
                    // if there is a container next to the source
                    if (containers.length > 0) {
                        // spawn a miner
                        console.log("Trying to spawn a miner with " + room.energyAvailable);
                        name = this.createMiner(source.id);
                        break;
                    }
                    // TODO: else => create a container on a valid square next to the source
                }
            }
        }

        // if none of the above caused a spawn command check for other roles
        if (name == undefined) {
            for (let role of listOfRoles) {
                if (numberOfCreeps[role] < this.memory.minCreeps[role]) {
                    if (role == 'hauler') {
                        name = this.createHauler(currentEnergy);
                    }
                    else {
                        name = this.createCustomCreep(currentEnergy, role);
                    }
                    break;
                }
            }
        }

        // print name to console if spawning was a success
        if (name != undefined && _.isString(name)) {
            console.log(this.name + " spawned new creep: " + name + " (" + Game.creeps[name].memory.role + ")");
            for (let role of listOfRoles) {
                console.log(role + ": " + numberOfCreeps[role]);
            }
        }
    };

// create a new function for StructureSpawn
StructureSpawn.prototype.createCustomCreep =
    function (energy, roleName) {
        if (energy < 200) {
          // can't create a creep. dump out.
          return;
        }
        console.log("trying to create a " + roleName + " with " + energy + " energy.");
        // create a balanced body as big as possible with the given energy
        var numberOfParts = Math.floor(energy / 200);
        // make sure the creep is not too big (more than 50 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(50 / 3));
        var body = [];
        for (let i = 0; i < numberOfParts; i++) {
            body.push(WORK);
        }
        for (let i = 0; i < numberOfParts; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
        }

        // create creep with the created body and the given role
        return this.spawnCreep(body, roleName + '_' + Game.time, { memory: { role: roleName, working: false }});
    };

StructureSpawn.prototype.createMiner =
    function (sourceId) {
        return this.spawnCreep([WORK, WORK, WORK, WORK, WORK, MOVE], 'miner_' + Game.time,
                                {memory: { role: 'miner', sourceId: sourceId }});
    };

StructureSpawn.prototype.createHauler =
    function (energy) {
        console.log("trying to create a hauler with " + energy + " energy.");
        // create a body with twice as many CARRY as MOVE parts
        var numberOfParts = Math.floor(energy / 150);
        // make sure the creep is not too big (more than 50 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(50 / 3));
        var body = [];
        for (let i = 0; i < numberOfParts * 2; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
        }

        // create creep with the created body and the role 'hauler'
        return this.spawnCreep(body, 'hauler_' + Game.time, {memory: { role: 'hauler', working: false }});
    };
