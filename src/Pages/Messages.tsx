import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Messages.css";

export default function Messages() {
    const [searchParams] = useSearchParams();
    const toUserId = searchParams.get('to');
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeContact, setActiveContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    
    const activeContactRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        activeContactRef.current = activeContact;
    }, [activeContact]);

    useEffect(() => {
        initChat();
    }, []);

    const initChat = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        // Fetch contacts for the sidebar
        const { data: profs } = await supabase.from('profiles').select('*').neq('id', user.id).limit(20);
        if (profs) {
            setContacts(profs);
            
            let targetContact = profs[0];
            if (toUserId) {
                const specific = profs.find(p => p.id === toUserId);
                if (specific) targetContact = specific;
            }
            if (targetContact) {
                setActiveContact(targetContact);
                loadMessages(user.id, targetContact.id);
            }
        }

        // Subscribe to real-time messages
        supabase.channel('public:messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
              const newMsg = payload.new;
              const currentActive = activeContactRef.current;
              
              if (currentActive && (
                  (newMsg.sender_id === user.id && newMsg.receiver_id === currentActive.id) ||
                  (newMsg.receiver_id === user.id && newMsg.sender_id === currentActive.id)
              )) {
                  setMessages(prev => [...prev, newMsg]);
                  scrollToBottom();
              }
          }).subscribe();
    };

    const loadMessages = async (myId: string, theirId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: true });
            
        if (data) {
            setMessages(data);
            scrollToBottom();
        }
    };

    const selectContact = (contact: any) => {
        setActiveContact(contact);
        if (currentUser) loadMessages(currentUser.id, contact.id);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact || !currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from('messages').insert([{
            sender_id: currentUser.id,
            receiver_id: activeContact.id,
            content: msgText
        }]);
        
        if(error) alert("Error sending message: " + error.message);
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <div className="dash-container msg-container">
            <div className="msg-sidebar panel-card">
                <h2 className="msg-header">Conversations</h2>
                <div className="contacts-list">
                    {contacts.map(c => (
                        <div 
                           key={c.id} 
                           className={`contact-item ${activeContact?.id === c.id ? 'active-contact' : ''}`}
                           onClick={() => selectContact(c)}
                        >
                            <div className="c-avatar">
                                {c.avatar_url ? <img src={c.avatar_url} style={{width:'100%', borderRadius:'50%', objectFit:'cover'}} alt="avatar"/> : c.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="c-info-msg">
                                <h4>{c.full_name}</h4>
                                <p>{c.role || 'User'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="msg-main panel-card">
                {activeContact ? (
                    <>
                        <div className="msg-active-header">
                            <h3>Chat with {activeContact.full_name}</h3>
                        </div>
                        <div className="msg-history">
                            {messages.map(m => {
                                const isMe = m.sender_id === currentUser?.id;
                                return (
                                    <div key={m.id} className={`msg-bubble-wrapper ${isMe ? 'msg-right' : 'msg-left'}`}>
                                        <div className={`msg-bubble ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
                                            {m.content}
                                        </div>
                                        <span className="msg-time">{new Date(m.created_at).toLocaleTimeString([],{hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                            {messages.length === 0 && <p className="text-gray text-center mt-10">No messages yet. Say hi!</p>}
                        </div>
                        <form className="msg-input-area" onSubmit={sendMessage}>
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)} 
                            />
                            <button type="submit" className="btn-primary-purple">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="msg-empty-state">
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
