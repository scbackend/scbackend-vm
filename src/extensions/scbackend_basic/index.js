class ScbackendBasicExtension {
    constructor(runtime) {
        this.runtime = runtime;
        this.pblocks = [];
    }

    getInfo() {
        const basicblocks = [
            {
                opcode: 'newconnect',
                blockType: 'hat',
                text: '当新的连接收到',
            },
            {
                opcode: 'lastconnect',
                blockType: 'reporter',
                text: '最后一次连接的id',
            },
            {
                opcode: 'message',
                blockType: 'hat',
                text: '当 [connectid] 收到消息',
                arguments: {
                    connectid: {
                        type: 'string',
                        defaultValue: 'connectid',
                    }
                }
            },
            {
                opcode: 'sendmessage',
                blockType: 'command',
                text: '向 [connectid] 发送消息 [message]',
                arguments: {
                    connectid: {
                        type: 'string',
                        defaultValue: 'connectid',
                    },
                    message: {
                        type: 'string',
                        defaultValue: 'message',
                    }
                }
            },
            {
                opcode: 'getdata',
                blockType: 'reporter',
                text: '获取 [connectid] 的数据',
                arguments: {
                    connectid: {
                        type: 'string',
                        defaultValue: 'connectid',
                    }
                }
            },
        ];
        return {
            id: 'scbackendbasic',
            name: 'scbackend基础接口',
            blocks: basicblocks
        };
    }

    newconnect() {
    }

    lastconnect() {
        if (!this.runtime) {
            return '';
        }
        return this.runtime.scbackend.lastconnect || '';
    }

    message(args) {
        // 留空或自定义实现
    }

    sendmessage(args) {
        // 留空或自定义实现
    }

    getdata(args) {
        if (!this.runtime || !this.runtime.scbackend) {
            return '';
        }
        const connectid = args.connectid;
        if (connectid && this.runtime.scbackend.data && this.runtime.scbackend.data[connectid]) {
            return this.runtime.scbackend.data[connectid];
        }
        return '';
    }
}

if (typeof Scratch !== 'undefined') {
    Scratch.extensions.register(new ScbackendBasicExtension());
} else {
    module.exports = ScbackendBasicExtension;
}
