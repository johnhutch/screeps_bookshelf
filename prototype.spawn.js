var listOfRoles = ['harvester', 'attacker', 'miner', 'hauler', 'filler', 'claimer', 'upgrader', 'builder', 'structureRepairer', 'roadRepairer', 'defenseRepairer'];
var listOfLdRoles = ['longDistanceHarvester', 'longDistanceSalvager', 'longDistanceBuilder', 'longDistanceUpgrader'];

StructureSpawn.prototype.notify =
    function (name, creepRole) {
        console.log("******* " + this.name + " spawned new " + creepRole + " *******" );
        let storage = this.room.storage != undefined ? this.room.storage.store[RESOURCE_ENERGY] : 0;
        let terminal = this.room.terminal != undefined ? this.room.terminal.store[RESOURCE_ENERGY] : 0;
        console.log("Energy in storage: " + storage + ". Energy in terminal: " + terminal);
        this.room.visual.text(
            '🛠️' + creepRole,
            this.pos.x + 1,
            this.pos.y,
            {align: 'left', opacity: 0.8});
    };

StructureSpawn.prototype.turnOnEmergencyMode =
    function () {
        // find sources without containers
        // build adjacent containers
      // tell builders to use sources for energy
      // reduce creep counts
    };

StructureSpawn.prototype.turnOnEmergencyMode =
    function () {
    };

StructureSpawn.prototype.findContaineredSourceId =
    function () {
        let room = this.room;
        let sources = room.find(FIND_SOURCES);
        let extractors = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_EXTRACTOR });
        sources = [...sources, ...extractors];
        let creepsInRoom = room.find(FIND_MY_CREEPS);
        let sourceId = undefined;

        for (let source of sources) {
            // if this is an extractor, get the mineral source ID below it
            if (source.structureType && source.structureType == STRUCTURE_EXTRACTOR) {
                source = source.pos.lookFor(LOOK_MINERALS)[0];
            }

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
        if (this.memory.minCreeps == undefined) { 
            this.memory.minCreeps = {};
        }

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

        let hostile = this.room.find(FIND_HOSTILE_CREEPS);

        // and then murder it
        if (hostile.length > 0) {
            name = this.createAttacker(room.energyAvailable);
            creepRole = "attacker";
        }

        // if no harvesters are left AND either no miners or no hauler are left
        //  create a backup creep
        if (numberOfCreeps['harvester'] == 0 && numberOfCreeps['hauler'] == 0) {
            this.memory.backup_needed = true;
            // if there are still miners or enough energy in Storage left
            if (numberOfCreeps['miner'] > 0 ||
                (room.storage != undefined && room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
                let haulerTarget = room.getHaulerTarget(this.memory.minCreeps['hauler']);
                if (haulerTarget) { 
                    name = this.createHauler(150, haulerTarget);
                    creepRole = "hauler for " + haulerTarget;
                }
            }
            // if there is no miner and not enough energy in Storage left
            else {
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
                name = this.createMiner(sourceId, currentEnergy);
                creepRole = "miner";
            }
        }

        // make sure every container has at a couple haulers assigned to it
        if (name == undefined) {
            let haulerTarget = room.getHaulerTarget(this.memory.minCreeps['hauler']);
            if (haulerTarget) {
                name = this.createHauler(150, haulerTarget);
                creepRole = "hauler for " + haulerTarget;
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
                } else if (numberOfCreeps[role] < this.memory.minCreeps[role]) {
                    if (role == 'hauler') {
                        let haulerTarget = room.getHaulerTarget(this.memory.minCreeps['hauler']);
                        if (haulerTarget) {
                            name = this.createHauler(150, haulerTarget);
                            creepRole = "hauler for " + haulerTarget;
                        }
                    } else if (role == 'filler') {
                        name = this.createFiller(150);
                    } else {
                        name = this.createCustomCreep(currentEnergy, role);
                    }
                    creepRole = role;
                    break;
                }
            }
        }

        // if nothing's created above, let's try to create some long distance creeps
        if (name == undefined) {
            let creepNum = {};

            // make sure this spawn had a minLdRoles array in memory
            if (this.memory.minLdRoles == undefined) {
                this.memory.minLdRoles = {};
            }
            // cycle through the roles we defined in listOfRoles at the top of this doc
            for (let ldRole of listOfLdRoles) {
                // create objects for any roles not already in this spawn's minLdRoles memory object
                if (this.memory.minLdRoles[ldRole] == undefined) {
                    this.memory.minLdRoles[ldRole] = { };
                }

                // cycle through the rooms in the spawn's minLdRole object for the current ldRole
                for (let roomName in this.memory.minLdRoles[ldRole]) {
                    // count the number of creeps in the game currently assigned to this room
                    creepNum[roomName] = _.sum(Game.creeps, (c) =>
                        c.memory.role == ldRole && c.memory.targetRoom == roomName);

                    // if we don't have enough ldRole creeps in that room, create one
                    if ( (creepNum[roomName] < this.memory.minLdRoles[ldRole][roomName])
                      && (currentEnergy > 500) ) {
                        name = this.createLdCreep(currentEnergy, 2, room.name, roomName, ldRole);
                        creepRole = ldRole;
                    }
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
        numberOfParts = Math.min(numberOfParts, Math.floor(15 / 3));
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
    function (sourceId, energy) {
        let extensions = this.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_EXTENSION });
        if (extensions.length > 5) {
            result = this.spawnCreep([WORK, WORK, WORK, WORK, WORK, MOVE], 'miner_' + Game.time,
                                    {memory: { role: 'miner', sourceId: sourceId }});
        } else {
            let numberOfWorks = Math.floor((energy - 50) / 100);
            var body = [];
            for (let i = 0; i < numberOfWorks; i++) {
                body.push(WORK);
            }
            body.push(MOVE);
            result = this.spawnCreep(body, 'miner_' + Game.time,
                                    {memory: { role: 'miner', sourceId: sourceId }});
        }
        return result;
    };

StructureSpawn.prototype.createAttacker=
    function (energy, resourceType) {
        // create a body with twice as many CARRY as MOVE parts
        var numberOfParts = Math.floor(energy / 150);
        // make sure the creep is not too big (more than 6 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(6 / 3));
        var body = [];
        for (let i = 0; i < numberOfParts * 2; i++) {
            body.push(ATTACK);
        }
        for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
        }

        // create creep with the created body and the role 'attacker'
        return this.spawnCreep(body, 'attacker_' + Game.time, {memory: { role: 'attacker'}});
    };

StructureSpawn.prototype.createFiller =
    function (energy, target) {
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
        return this.spawnCreep(body, 'filler_' + Game.time, {memory: { role: 'filler', working: false }});
    };

StructureSpawn.prototype.createHauler =
    function (energy, target) {
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
        return this.spawnCreep(body, 'hauler_' + Game.time, {memory: { role: 'hauler', working: false, targetId: target }});
    };

// create a new function for StructureSpawn
StructureSpawn.prototype.createClaimer =
    function (target) {
        console.log("creating claimer? with target: " + target);
        return this.spawnCreep([CLAIM, MOVE], 'claimer_' + Game.time, {memory: { role: 'claimer', target: target }});
    };

StructureSpawn.prototype.createLdCreep = 
    function (energy, numberOfWorkParts, home, targetRoom, roleName) {
        // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
        if (energy < 400) {
          // can't create a creep. dump out.
          return;
        }
        // create a balanced body as big as possible with the given energy
        var numberOfParts = Math.floor(energy / 200);
        // make sure the creep is not too big (more than 15 parts)
        numberOfParts = Math.min(numberOfParts, Math.floor(12 / 3));
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

        // create creep with the created body
        return this.spawnCreep(body, roleName + '_' + Game.time, { memory: {
            role: roleName,
            home: home,
            targetRoom: targetRoom,
            working: false
        }});
    };
