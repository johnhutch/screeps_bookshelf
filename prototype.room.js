Room.prototype.checkForContainers = 
    function () {
        let sources = this.find(FIND_SOURCES);
        for (let source of sources) {
            let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType == STRUCTURE_CONTAINER
            });
            if (containers.length > 0) {
                this.memory.hasContainers = true;
                break;
            }
            this.memory.hasContainers = false;
        }
    };

Room.prototype.energySources = 
    function () {
        let dropped_resources = this.find(FIND_DROPPED_RESOURCES);
        let ruins = this.find(FIND_RUINS, {
            filter: s => (s.store[RESOURCE_ENERGY] > 0)
        });
        let containers = this.find(FIND_STRUCTURES, {
            filter: s => (s.structureType == STRUCTURE_CONTAINER)
                      && s.store[RESOURCE_ENERGY] > 0
        });
        let terminal = this.terminal && this.terminal.store[RESOURCE_ENERGY] > 0 ? this.terminal : null;
        let storage = this.storage && this.storage.store[RESOURCE_ENERGY] > 0 ? this.storage : null;
        let sources = [...ruins, ...dropped_resources, ...containers]
        return sources;
    };
