import logo from './logo.svg';
import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { useState } from 'react';

function App() {
  const [ start, setStart ] = useState(new Date());
  const [ end, setEnd ] = useState(new Date());
  const [ eventName, setEventName ] = useState("");
  const [ eventDescription, setEventDescription ] = useState("");
  const [emails, setEmails] = useState([{ email: '' }]);
  const [emailErrors, setEmailErrors] = useState([false]);

  const session = useSession(); // tokens, when session exists we have a user
  const supabase = useSupabaseClient(); // talk to supabase!
  const { isLoading } = useSessionContext();
  const handleEmailChange = (index, value) => { const updatedEmails = emails.map((emailObj, i) => i === index ? { email: value } : emailObj); setEmails(updatedEmails); const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; const isValid = emailPattern.test(value); const updatedErrors = emailErrors.map((error, i) => i === index ? !isValid : error); setEmailErrors(updatedErrors); }; const addEmailField = () => { setEmails([...emails, { email: '' }]); setEmailErrors([...emailErrors, false]); }; 
  
  if(isLoading) {
    return <></>
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if(error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCalendarEvent() {
    console.log("Creating calendar event");
    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      },
      'end': {
        'dateTime': end.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      },
      'attendees': emails,
      'reminders': {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 2 }, // 2 minutes before start
          { method: "popup", minutes: -2 }, // 2 minutes after start
          { method: "popup", minutes: -4 }, // 4 minutes after start
          { method: "popup", minutes: -6 }, // 6 minutes after start
          // Add more reminders as needed
        ],
      },
    }
    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization':'Bearer ' + session.provider_token // Access token for google
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      alert("Event created, check your Google Calendar!");
    });
  }

  console.log(session);
  console.log(start);
  console.log(eventName);
  console.log(eventDescription);
  console.log(emails)
  return ( 
  <div className="App"> 
  <div className="form-container"> 
    {session ? ( 
      <> 
      <h2 className="form-heading">Hey there, {session.user.email}</h2> 
      <div className="form-group-date"> <label>Start of your event</label> 
      <DateTimePicker onChange={setStart} value={start} /> 
      </div> <div className="form-group-date"> <label>End of your event</label> <DateTimePicker onChange={setEnd} value={end} /> </div> <div className="form-group"> <label>Event name</label> <input type="text" onChange={(e) => setEventName(e.target.value)} value={eventName} placeholder="Enter event name" /> </div> <div className="form-group"> <label>Event description</label> <input type="text" onChange={(e) => setEventDescription(e.target.value)} value={eventDescription} placeholder="Enter event description" /> </div> <div className="form-group"> 
        <label>Email Addresses</label> 
        {emails.map((emailObj, index) => ( <div key={index} className="mb-2"> <input type="email" className={`w-full p-2 border rounded ${emailErrors[index] ? 'border-red-500' : ''}`} value={emailObj.email} onChange={(e) => handleEmailChange(index, e.target.value)} placeholder="Enter email" /> {emailErrors[index] && <p className="error-message">Invalid email address</p>} </div> ))}
           <button onClick={addEmailField} className="btn btn-add-email"> Add Another Email </button> 
           </div> <hr /> <button onClick={createCalendarEvent} className="btn btn-primary"> Create Calendar Event </button> <button onClick={signOut} className="btn btn-secondary"> Sign Out </button> </> ) : ( <button onClick={googleSignIn} className="btn btn-primary"> Sign In With Google </button> )} </div> </div> );;
}

export default App;
