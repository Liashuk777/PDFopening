import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState({ id: 'user1', name: 'You' });

  useEffect(() => {
    // Підключення до WebSocket
    const newSocket = io('http://192.168.56.1:8000', { transports: ['websocket'] });
    setSocket(newSocket);
  
    newSocket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
  
    return () => newSocket.close();
  }, []);
  
  const sendMessage = () => {
    if (text.trim() && socket) {
      const message = {
        sender: user.id,
        receiver: 'user2',
        text,
        timestamp: new Date().toISOString()
      };
      socket.emit('message', message);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={item.sender === user.id ? styles.myMessage : styles.otherMessage}>
            <Text>{item.text}</Text>
            <Text style={styles.time}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6A5ACD',
    padding: 12,
    borderRadius: 12,
    margin: 8,
    maxWidth: '80%'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    margin: 8,
    maxWidth: '80%'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    marginRight: 8
  },
  time: {
    fontSize: 10,
    color: '#666',
    marginTop: 4
  }
});

export default App;