import asyncio
import websockets
import json

class Client:
    def __init__(self, id, websocket, tunnel_id):
        self.id = id
        self.socket = websocket
        self.tunnel_id = tunnel_id

tunnels = {}
clients = {}

async def broadcast_clients(tunnel_id):
    for client_id in tunnels[tunnel_id]:
        if client_id not in clients:
            continue
        await clients[client_id].socket.send(json.dumps({"type": "broadcast", "count": len(tunnels[tunnel_id])}))

async def handle_connection(websocket: websockets.WebSocketClientProtocol, path):
    global clients
    global tunnels

    client_address = websocket.remote_address
    print(f"New connection from {client_address}")

    try:
        async for message in websocket:
            data = json.loads(message)
            # print(data)
            type = data["type"]
            print(data)
            # Register client with server
            if type == "register":
                tunnel_id = data["tunnelId"]
                client_id = data["clientId"]
                # Add client to map of clients
                if client_id not in clients:
                    clients[client_id] = Client(client_id, websocket, tunnel_id)
                if tunnel_id not in tunnels:
                    tunnels[tunnel_id] = set()
                tunnels[tunnel_id].add(client_id)

                await websocket.send(json.dumps({"type": "register_success", "id": len(tunnels[tunnel_id])-1}))

                # now we broadcast the number of connections to all clients in the tunnel
                await broadcast_clients(tunnel_id)


            # Handle offers
            if type == "offer":
                # Broadcast this offer to all other clients except itself
                # Get client ID from offer message and find its tunnel
                client_id = data["clientId"]
                tunnel_id = clients[client_id].tunnel_id
                # Iterate through and send offer to all other clients except itself
                for peer_id in tunnels[tunnel_id]:
                    if peer_id != client_id:
                        await clients[peer_id].socket.send(message)

            # Handle answers
            elif type == "answer":
                print(data)
                # The answer gets sent to the client that initially made the offer. 
                sender_id = data["senderId"]
                if sender_id in clients:
                    await clients[sender_id].socket.send(message)
            
            # Handle ICE candidates
            elif type == "ice":
                # Broadcast the ice candidates to all other clients except itself
                # Get client ID from offer message and find its tunnel
                client_id = data["clientId"]
                tunnel_id = clients[client_id].tunnel_id
                # Iterate through and send ice candidates to all other clients except itself
                for peer_id in tunnels[tunnel_id]:
                    if peer_id != client_id:
                        await clients[peer_id].socket.send(message)

    # Websocket closed unexpectedly
    except websockets.ConnectionClosed:
        print(f"Connection with {client_address} closed")
    
    # Cleanup client from map
    finally:
        print(f"Connection with {client_address} closed")
        disconnected_client = None

        for client_id, client in list(clients.items()):
            if client.socket == websocket:
                # remove from clients and tunnels
                disconnected_client = clients.pop(client_id)
                tunnels[disconnected_client.tunnel_id].remove(client_id)

                # broadcast to remaining clients in tunnel
                await broadcast_clients(disconnected_client.tunnel_id)
                
                # remove tunnel if empty 
                if not tunnels[disconnected_client.tunnel_id]:
                    del tunnels[disconnected_client.tunnel_id]
                print(f"Removed client {client_id} from tunnel {disconnected_client.tunnel_id}")
                break
        

        if disconnected_client:
            # Notify remaining clients in the same tunnel about the disconnection
            for peer_id in tunnels.get(disconnected_client.tunnel_id, []):
                if peer_id in clients:
                    try:
                        await clients[peer_id].socket.send(json.dumps({
                            "type": "client_disconnected",
                            "clientId": disconnected_client.id
                        }))
                    except Exception as e:
                        print(f"Error notifying peer {peer_id} about disconnection: {e}")

async def main():
    print("Starting signaling server...")
    server = await websockets.serve(handle_connection, 'localhost', 8765)
    print("Signaling server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
