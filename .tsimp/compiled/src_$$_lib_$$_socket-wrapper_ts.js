import { EventEmitter } from 'events';
export default class SocketWrapper extends EventEmitter {
    _forwardedEvents = {};
    get bufferSize() {
        return this.socket.bufferSize;
    }
    get bytesRead() {
        return this.socket.bytesRead;
    }
    get bytesWritten() {
        return this.socket.bytesWritten;
    }
    get connecting() {
        return this.socket.connecting;
    }
    get localAddress() {
        return this.socket.localAddress;
    }
    get localPort() {
        return this.socket.localPort;
    }
    get remoteAddress() {
        return this.socket.remoteAddress;
    }
    get remoteFamily() {
        return this.socket.remoteFamily;
    }
    get remotePort() {
        return this.socket.remotePort;
    }
    address() {
        return this.socket.address();
    }
    connect(arg0, ...args) {
        this.socket.connect(arg0, ...args);
        return this;
    }
    end() {
        this.socket.end();
    }
    setTimeout(timeout, callback) {
        this.socket.setTimeout(timeout, callback);
        return this;
    }
    _connectForwardedEvents(socket) {
        if (socket) {
            for (const key of Object.keys(this._forwardedEvents)) {
                socket.on(key, this._forwardedEvents[key]);
            }
        }
        return socket;
    }
    _disconnectForwardedEvents(socket) {
        if (socket) {
            for (const key of Object.keys(this._forwardedEvents)) {
                socket.off(key, this._forwardedEvents[key]);
            }
        }
        return socket;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0LXdyYXBwZXIuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2phbWVzdGFsbWFnZS9XZWJzdG9ybVByb2plY3RzL3FyYy1jbGllbnQtanMvIiwic291cmNlcyI6WyJzcmMvbGliL3NvY2tldC13cmFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFTcEMsTUFBTSxDQUFDLE9BQU8sT0FBZ0IsYUFBYyxTQUFRLFlBQVk7SUFHNUMsZ0JBQWdCLEdBQVEsRUFBRSxDQUFDO0lBRTlDLElBQUksVUFBVTtRQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELElBQUksU0FBUztRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDOUIsQ0FBQztJQUVELElBQUksWUFBWTtRQUNmLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDakMsQ0FBQztJQUVELElBQUksVUFBVTtRQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELElBQUksWUFBWTtRQUNmLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDakMsQ0FBQztJQUVELElBQUksU0FBUztRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDOUIsQ0FBQztJQUVELElBQUksYUFBYTtRQUNoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDYixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQy9CLENBQUM7SUFFRCxPQUFPO1FBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBUyxFQUFFLEdBQUcsSUFBVztRQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNuQyxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxHQUFHO1FBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsVUFBVSxDQUFDLE9BQWUsRUFBRSxRQUFxQjtRQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRVMsdUJBQXVCLENBQUMsTUFBb0I7UUFDckQsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNaLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVTLDBCQUEwQixDQUFDLE1BQW9CO1FBQ3hELElBQUksTUFBTSxFQUFFLENBQUM7WUFDWixLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDdEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7Q0FDRCJ9