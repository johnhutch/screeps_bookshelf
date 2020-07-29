var listOfRoles = ['harvester', 'miner', 'hauler', 'claimer', 'upgrader', 'fixer', 'builder', 'wallRepairer', 'rampartRepairer'];

Structure.prototype.notify =
    function (name, creepRole) {
        console.log("******* " + this.name + " spawned new " + creepRole + " *******" );
        let storage = this.room.storage != undefined ? this.room.storage.store[RESOURCE_ENERGY] : 0;
        console.log("Energy in storage: " + storage);
    };

Structure.prototype.findContaineredSourceId =
    function () {
        let room = this.room;
        let sources = room.find(FIND_SOURCES);
        let creepsInRoom = room.find(FIND_MY_CREEPS);
        let sourceId = undefined;

        for (let source of sources) {
            // if the source has no miner
            if (!_.some(creepsInRoom, c => c.memory.role == 'miner' && c.memory.sourceId == source.id)) {
                // check whether or not the source has a container
                let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                });
                // if there is a container next to the source
                if (containers.length > 0) {
                    sourceId = source.id;
                    break;
                }
                // TODO: else => create a container on a valid square next to the source
            }
        }
        return (sourceId);
    };

// create a new function for StructureSpawn
StructureSpawn.prototype.spawnCreepsIfNecessary =
    function () {
        let room = this.room;

        // init creep count defaults if they're not set
        for (let role of listOfRoles) {
            if (this.memory.minCreeps[role] == undefined) {
              console.log(room.name + " don't know shit about " + role);
              this.memory.minCreeps[role] = 1;
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
        let creepRole = undefined;

        // if no harvesters are left AND either no miners or no hauler are left
        //  create a backup creep
        if (numberOfCreeps['harvester'] == 0 && numberOfCreeps['hauler'] == 0) {
            this.memory.backup_needed = true;
            // if there are still miners or enough energy in Storage left
            if (numberOfCreeps['miner'] > 0 ||
                (room.storage != undefined && room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
                console.log("No harvesters or haulers, but we have a miner or some stored energy, so creating a hauler");
                name = this.createHauler(150);
                creepRole = "hauler";
            }
            // if there is no miner and not enough energy in Storage left
            else {
                console.log("No harvester, haulers, miners, or stored energy. Created a harvester");
                name = this.createCustomCreep(room.energyAvailable, 'harvester');
                creepRole = "harvester";
            }
        }
        // if no backup creep is required
        else {
            this.memory.backup_needed = false;
            // check if all sources have miners
            let sourceId = this.findContaineredSourceId();

            if(sourceId) {
                name = this.createMiner(sourceId);
                creepRole = "miner";
            }
        }

        // if none of the above caused a spawn command check for other roles
        if (name == undefined) {
            for (let role of listOfRoles) {
                // check for claim order
                if (role == 'claimer' 
                 && this.memory.claimRoom != undefined 
                 && room.energyAvailable >= 650) {
                    // try to spawn a claimer
                    name = this.createClaimer(this.memory.claimRoom);
                    creepRole = "claimer";
                    // if that worked
                    if (name == 0) {
                        // delete the claim order
                        delete this.memory.claimRoom;
                    }
                }
                else if (numberOfCreeps[role] < this.memory.minCreeps[role]) {
                    if (role == 'hauler') {
                        name = this.createHauler(150);
                    } else {
                        name = this.createCustomCreep(currentEnergy, role);
                    }
                    creepRole = role;
                    break;
                }
            }
        }

        // if none of the above caused a spawn command check for LongDistanceHarvesters
        let numberOfLongDistanceHarvesters = {};
        if (name == undefined) {
            // if we don't have our min LDH object
            // (minLDH object is a list of roomnames which contain their min LDH counts)
            if (this.memory.minLongDistanceHarvesters == undefined) {
                this.memory.minLongDistanceHarvesters = {};
            }
            // count the number of long distance harvesters globally
            for (let roomName in this.memory.minLongDistanceHarvesters) {
                numberOfLongDistanceHarvesters[roomName] = _.sum(Game.creeps, (c) =>
                    c.memory.role == 'longDistanceHarvester' && c.memory.target == roomName)

                if ( (numberOfLongDistanceHarvesters[roomName] < this.memory.minLongDistanceHarvesters[roomName])
                  && (currentEnergy > 500) ) {
                    name = this.createLongDistanceHarvester(currentEnergy, 2, room.name, roomName, 0);
                    creepRole = "LDH";
                }
            }
        }

        // print name to console if spawning was a success
        if (name == 0) {
            this.notify(name, creepRole);

            /*
            for (let role of listOfRoles) {
                console.log(role + ": " + numberOfCreeps[role]);
            }
            */
        }
    };

// create a new function for StructureSpawn
StructureSpawn.prototype.createCustomCreep =
    function (energy, roleName) {
        if (energy < 200) {
          // can't create a creep. dump out.
          return;
        }
        // create a balanced body as big as possible with the given energy
        var numberOfParts = Math.floor(energy / 200);
        // make sure the creep is not too big (more than 15 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(9 / 3));
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
        // create a body with twice as many CARRY as MOVE parts
        var numberOfParts = Math.floor(energy / 150);
        // make sure the creep is not too big (more than 6 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(6 / 3));
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

// create a new function for StructureSpawn
StructureSpawn.prototype.createClaimer =
    function (target) {
        console.log("creating claimer? with target: " + target);
        return this.spawnCreep([CLAIM, MOVE], 'claimer_' + Game.time, {memory: { role: 'claimer', target: target }});
    };

StructureSpawn.prototype.createLongDistanceHarvester =
    function (energy, numberOfWorkParts, home, target, sourceIndex) {
        // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
        var body = [];
        for (let i = 0; i < numberOfWorkParts; i++) {
            body.push(WORK);
        }

        // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
        energy -= 150 * numberOfWorkParts;

        var numberOfParts = Math.floor(energy / 100);
        // make sure the creep is not too big (more than 15 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor((15 - numberOfWorkParts * 2) / 2));
        for (let i = 0; i < numberOfParts; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
            body.push(MOVE);
        }

        // create creep with the created body
        return this.spawnCreep(body, "longDistanceHarvester" + '_' + Game.time, { memory: {
            role: 'longDistanceHarvester',
            home: home,
            target: target,
            sourceIndex: sourceIndex,
            working: false
        }});
    };
