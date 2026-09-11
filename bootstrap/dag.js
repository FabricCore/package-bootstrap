class DagNode {
    /**
     * incoming -> this node
     * @type {Set<DagNode>}
     */
    incoming = new Set();
    /**
     * this node -> outgoing
     * @type {Set<DagNode>}
     */
    outgoing = new Set();

    /**
     * @param {string} id
     */
    constructor(id) {
        /** @type {string} */
        this.id = id;
    }
}

class Dag {
    /** @type {Map<string, DagNode>} */
    nodes = new Map();

    /**
     * @param {string} id - Unique ID of the node
     * @returns {void}
     */
    addNode(id) {
        if (this.nodes.has(id)) throw new Error(`duplicate node id ${id}`);

        this.nodes.set(id, new DagNode(id));
    }

    /**
     * create edge from -> to
     * @param {string} from - ID of the from node
     * @param {string} to - ID of the to node
     * @returns {void}
     */
    addEdge(from, to) {
        const fromNode = this.nodes.get(from);
        const toNode = this.nodes.get(to);

        if (!fromNode) throw new Error(`cannot find from node ${from}`);

        if (!toNode) throw new Error(`cannot find from node ${to}`);

        if (fromNode.outgoing.has(toNode))
            throw new Error(`the edge ${from} -> ${to} already exists`);

        fromNode.outgoing.add(toNode);
        toNode.incoming.add(fromNode);
    }

    /**
     * gives topological ordering of the nodes
     * @returns {string[]}
     */
    toposort() {
        /** @type {string[]} */
        let ordering = [];

        /** @type {Set<DagNode>} */
        let visited = new Set();
        /** @type {Set<DagNode>} */
        let visiting = new Set();

        /**
         * @param {DagNode} node
         * @returns {void}
         */
        function dfs(node) {
            if (visited.has(node)) return;
            if (visiting.has(node)) throw new Error(`graph contains cycle`); // TODO: detect cycles dynamically on adding connection

            visiting.add(node);

            for (const neighbour of node.outgoing.values()) dfs(neighbour);

            visited.delete(node);
            visited.add(node);
            ordering.unshift(node.id);
        }

        for (const node of this.nodes.values()) {
            dfs(node);
        }

        return ordering;
    }

    /**
     * find transitive dependents of a set, includes the set
     *
     * @param {Set<string>} ids
     * @returns {Set<string>}
     */
    dependentsOf(ids) {
        /** @type {Set<string>} */
        let dependents = new Set();

        /**
         * @param {DagNode} node
         */
        const dfs = (node) => {
            if (dependents.has(node.id)) return;

            dependents.add(node.id);
            node.outgoing.forEach(dfs);
        };

        ids.forEach((id) => {
            const node = this.nodes.get(id);
            if (node === undefined) throw new Error(`node ${id} is not in DAG`);

            dfs(node);
        });

        return dependents;
    }

    /**
     * @param {string} id 
     * @returns {string[]}
     */
    immediateDependentsOf(id) {
        const node = this.nodes.get(id);
        if (node === undefined)
            throw new Error(`${id} is not in DAG`)

        return Array.from(node.outgoing).map(node => node.id);
    }
}

module.exports = Dag;
