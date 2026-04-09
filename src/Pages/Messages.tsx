import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Messages.css";

// Helper for relative timestamps
const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h ago`;
    if (diffInSeconds < 172800) return "Yesterday";
    return d.toLocaleDateString();
};

export default function Messages() {
    const [searchParams] = useSearchParams();
    const toUserId = searchParams.get('to');
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [activeContact, setActiveContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [partnerTyping, setPartnerTyping] = useState(false);
    
    const activeContactRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);
    const typingChannelRef = useRef<any>(null);
    const partnerTypingChannelRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        activeContactRef.current = activeContact;
        
        // Listen to active contact's typing broadcasts
        if (partnerTypingChannelRef.current) {
            supabase.removeChannel(partnerTypingChannelRef.current);
            partnerTypingChannelRef.current = null;
        }

        if (activeContact) {
            partnerTypingChannelRef.current = supabase.channel(`typing:${activeContact.id}`)
                .on('broadcast', { event: 'typing' }, payload => {
                    if (payload.payload.senderId === activeContact.id) {
                        setPartnerTyping(payload.payload.isTyping);
                    }
                })
                .subscribe();
        }

    }, [activeContact]);

    useEffect(() => {
        initChat();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
            if (typingChannelRef.current) {
                supabase.removeChannel(typingChannelRef.current);
            }
            if (partnerTypingChannelRef.current) {
                supabase.removeChannel(partnerTypingChannelRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const initChat = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        // Setup our own typing broadcast channel
        typingChannelRef.current = supabase.channel(`typing:${user.id}`).subscribe();

        // Setup dynamic contacts based strictly on business roles
        const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = me?.role || 'freelancer';

        let relatedProfileIds = new Set<string>();

        if (role === 'freelancer') {
            // Freelancer only sees clients they've sent a proposal to
            const { data: proposals } = await supabase.from('proposals').select('job_id').eq('freelancer_id', user.id);
            if (proposals && proposals.length > 0) {
                const jobIds = proposals.map((p: any) => p.job_id);
                const { data: jobs } = await supabase.from('jobs').select('client_id').in('id', jobIds);
                if (jobs) jobs.forEach((j: any) => relatedProfileIds.add(j.client_id));
            }
        } else {
            // Client only sees freelancers who have sent a proposal on their jobs
            const { data: jobs } = await supabase.from('jobs').select('id').eq('client_id', user.id);
            if (jobs && jobs.length > 0) {
                const jobIds = jobs.map((j: any) => j.id);
                const { data: proposals } = await supabase.from('proposals').select('freelancer_id').in('job_id', jobIds);
                if (proposals) proposals.forEach((p: any) => relatedProfileIds.add(p.freelancer_id));
            }
        }

        const targetIds = Array.from(relatedProfileIds);
        let profs: any[] = [];
        if (targetIds.length > 0) {
            const { data: fetchedProfs } = await supabase.from('profiles').select('*').in('id', targetIds);
            if (fetchedProfs) profs = fetchedProfs;
        }

        if (profs) {
            // Fetch all messages to build last message preview and unread counts
            const { data: allMessages } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            const enrichedProfs = profs.map(p => {
                const chatHistory = allMessages?.filter(m => 
                    (m.sender_id === p.id && m.receiver_id === user.id) ||
                    (m.receiver_id === p.id && m.sender_id === user.id)
                ) || [];
                const lastMsg = chatHistory.length > 0 ? chatHistory[0] : null;
                const unreadCount = chatHistory.filter(m => m.receiver_id === user.id && m.sender_id === p.id && !m.is_read).length;
                return { ...p, lastMessage: lastMsg, unreadCount };
            });

            // sort contacts by last message time
            enrichedProfs.sort((a,b) => {
                const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
                const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
                return bTime - aTime;
            });

            setContacts(enrichedProfs);
            
            let targetContact = enrichedProfs[0];
            if (toUserId) {
                const specific = enrichedProfs.find(p => p.id === toUserId);
                if (specific) targetContact = specific;
            }
            if (targetContact) {
                setActiveContact(targetContact);
                loadMessages(user.id, targetContact.id);
            }
        }

        // Subscribe to real-time messages
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase.channel(`public:messages:${user.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
              const newMsg = payload.new;
              const currentActive = activeContactRef.current;
              
              const isParticipant = newMsg.sender_id === user.id || newMsg.receiver_id === user.id;
              if (!isParticipant) return;

              // If we are actively chatting with the sender
              if (currentActive && (
                  (newMsg.sender_id === user.id && newMsg.receiver_id === currentActive.id) ||
                  (newMsg.receiver_id === user.id && newMsg.sender_id === currentActive.id)
              )) {
                  // Mark as read immediately if it's from them
                  if (newMsg.sender_id === currentActive.id && !newMsg.is_read) {
                      supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();
                      newMsg.is_read = true;
                  }

                  setMessages(prev => {
                      if (prev.some(m => m.id === newMsg.id)) return prev;

                      const optimisticIdx = prev.findIndex(
                          m =>
                              String(m.id).startsWith('temp-') &&
                              m.sender_id === newMsg.sender_id &&
                              m.receiver_id === newMsg.receiver_id &&
                              m.content === newMsg.content
                      );

                      if (optimisticIdx >= 0) {
                          const next = [...prev];
                          next[optimisticIdx] = newMsg;
                          return next;
                      }

                      return [...prev, newMsg];
                  });
              }

              // Update Contact List Previews and Unread Counts
              setContacts(prev => {
                  const updated = prev.map(c => {
                      if (c.id === newMsg.sender_id || c.id === newMsg.receiver_id) {
                          const isUnread = (!currentActive || currentActive.id !== c.id) && newMsg.sender_id === c.id;
                          return { ...c, lastMessage: newMsg, unreadCount: c.unreadCount + (isUnread ? 1 : 0) };
                      }
                      return c;
                  });
                  return updated.sort((a,b) => new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime());
              });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
              const updatedMsg = payload.new;
              setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          })
          .subscribe();
    };

    const loadMessages = async (myId: string, theirId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: true });
            
        if (data) {
            setMessages(data);

            // Mark unread messages from them as read
            const unreadIds = data.filter(m => m.sender_id === theirId && !m.is_read).map(m => m.id);
            if (unreadIds.length > 0) {
                await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
                setContacts(prev => prev.map(c => c.id === theirId ? { ...c, unreadCount: 0 } : c));
            }
        }
    };

    const selectContact = (contact: any) => {
        setActiveContact(contact);
        setPartnerTyping(false);
        if (currentUser) loadMessages(currentUser.id, contact.id);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (typingChannelRef.current && currentUser) {
            typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { senderId: currentUser.id, isTyping: true } });
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { senderId: currentUser.id, isTyping: false } });
            }, 2000);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact || !currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage("");

        // Stop typing indicator on send
        if (typingChannelRef.current) {
            typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { senderId: currentUser.id, isTyping: false } });
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const optimisticMessage = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: activeContact.id,
            content: msgText,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, optimisticMessage]);

        const { data, error } = await supabase.from('messages').insert([{
            sender_id: currentUser.id,
            receiver_id: activeContact.id,
            content: msgText,
            is_read: false
        }]).select('*').single();
        
        if (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Error sending message: " + error.message);
            return;
        }

        if (data) {
            setMessages(prev => {
                const replaced = prev.map(m => (m.id === tempId ? data : m));
                if (replaced.some(m => m.id === data.id)) return replaced;
                return [...replaced, data];
            });
        }
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
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
                                {c.lastMessage && (
                                    <div className="last-msg">
                                        {c.lastMessage.sender_id === currentUser?.id ? 'You: ' : ''}{c.lastMessage.content}
                                    </div>
                                )}
                            </div>
                            {c.unreadCount > 0 && (
                                <span className="unread-badge">{c.unreadCount}</span>
                            )}
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
                                        <span className="msg-time">
                                            {formatRelativeTime(m.created_at)}
                                            {isMe && (
                                              <span className="msg-read-status">
                                                  {m.is_read ? '✓✓' : '✓'}
                                              </span>
                                            )}
                                        </span>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                            {messages.length === 0 && <p className="text-gray text-center mt-10">No messages yet. Say hi!</p>}
                        </div>
                        {partnerTyping && <div className="typing-indicator">{activeContact.full_name} is typing...</div>}
                        <form className="msg-input-area" onSubmit={sendMessage}>
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                value={newMessage} 
                                onChange={handleInput} 
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
