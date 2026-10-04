import { useEffect, useState } from "react";
import eventCertLogo from "./assets/EventCert-logo.png";
import certificateGirl from "./assets/certificate-girl.png";
import "./App.css";
import * as XLSX from "xlsx";

const API = "http://localhost:3000";

function App() {
  const [page, setPage] = useState("home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("eventcertUser")) || null
  );

  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState("");
const [attendanceSearch, setAttendanceSearch] = useState("");
const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventCategory, setEventCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [login, setLogin] = useState({
    email: "",
    password: ""
  });

  const [register, setRegister] = useState({
    name: "",
    registerNumber: "",
    department: "",
    email: "",
    password: ""
  });

  const [event, setEvent] = useState({
    name: "",
    description: "",
    capacity: 100,
    date: "",
    venue: "",
    category: "Other",
    certificateTemplate: "template1"
  });

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {
  try {
    const response = await fetch(`${API}/events`);
    const data = await response.json();
    setEvents(data);

    if (user) {
      const registrationResponse = await fetch(
        `${API}/users/${user.id}/registrations`
      );

      const registrationData =
        await registrationResponse.json();

      setMyEvents(registrationData);
    }

  } catch {
    console.log("Backend is not running");
  }
}

  async function handleRegister() {
    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(register)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        setPage("login");
      } else {
        alert(data.message);
      }
    } catch {
      alert("Cannot connect to backend.");
    }
  }

  async function handleLogin() {
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(login)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem(
        "eventcertUser",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setPage("home");
    } catch {
      alert("Cannot connect to backend.");
    }
  }

  function logout() {
    localStorage.removeItem("eventcertUser");
    setUser(null);
    setPage("home");
  }

  async function registerForEvent(eventId) {
  if (!user) {
    alert("Please login first.");
    setPage("login");
    return;
  }

  try {
    const response = await fetch(`${API}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.id,
        eventId: eventId
      })
    });

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
      const myEventsResponse = await fetch(
        `${API}/users/${user.id}/registrations`
      );

      const myEventsData = await myEventsResponse.json();

      setMyEvents(myEventsData);
    }

  } catch {
    alert("Cannot connect to backend.");
  }
}

  async function getMyEvents() {
    if (!user) return;

    try {
      const response = await fetch(
        `${API}/users/${user.id}/registrations`
      );

      const data = await response.json();
      setMyEvents(data);
      setPage("myEvents");
    } catch {
      alert("Cannot load registrations.");
    }
  }
 const isRegisteredForEvent = (eventId) => {
  if (!Array.isArray(myEvents)) {
    return false;
  }

  return myEvents.some((registration) => {
    if (!registration || !registration.event) {
      return false;
    }

    return (
      registration.event._id === eventId ||
      registration.event === eventId
    );
  });
};
  async function getCertificates() {
  if (!user) return;

  try {
    const response = await fetch(
      `${API}/users/${user.id}/certificates`
    );

    const data = await response.json();
    setCertificates(data);
    setPage("certificates");
  } catch {
    alert("Cannot load certificates.");
  }
}

  async function createEvent() {
    try {
      console.log("EVENT BEING SENT:", event);
      const response = await fetch(`${API}/events`, {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-user-role": user.role,
  "x-user-id": user.id
},
        body: JSON.stringify(event)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Event created successfully!");

        setEvent({
          name: "",
          description: "",
          date: "",
          venue: "",
          category: "Other",
          certificateTemplate: "template1"
        });

        getEvents();
        setPage("events");
      } else {
        alert(data.message);
      }
    } catch {
      alert("Cannot connect to backend.");
    }
  }

  async function getRegistrations() {
    try {
      const response = await fetch(`${API}/registrations`, {
        headers: {
  "x-user-role": user.role,
  "x-user-id": user.id
}
      });

      const data = await response.json();
      setAllRegistrations(data);
      setPage("attendance");
    } catch {
      alert("Cannot load registrations.");
    }
  }

  async function markAttendance(id) {
    try {
      const response = await fetch(
        `${API}/registrations/${id}/attendance`,
        {
          method: "PATCH",
          headers: {
  "x-user-role": user.role,
  "x-user-id": user.id
}
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Attendance marked!");
        getRegistrations();
      } else {
        alert(data.message);
      }
    } catch {
      alert("Cannot connect to backend.");
    }
  }
  function exportAttendanceToExcel() {
  if (!selectedAttendanceEvent) {
    alert("Please select an event first.");
    return;
  }

  const selectedEvent = events.find(
    (event) => event._id === selectedAttendanceEvent
  );

  const eventRegistrations = allRegistrations.filter(
    (item) =>
      item.event &&
      item.event._id === selectedAttendanceEvent
  );

  if (!selectedEvent) {
    alert("Event not found.");
    return;
  }

  const attendanceData = eventRegistrations.map((item) => ({
    Participant: item.user.name,
    "Register Number": item.user.registerNumber,
    Department: item.user.department,
    Attendance: item.attended ? "Present" : "Not Marked"
  }));

  const worksheet = XLSX.utils.json_to_sheet(attendanceData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Attendance"
  );

  const fileName =
    `${selectedEvent.name}_Attendance.xlsx`
      .replace(/[\\/:*?"<>|]/g, "_");

  XLSX.writeFile(workbook, fileName);
}

  async function downloadCertificate(id) {
    try {
      const response = await fetch(
        `${API}/registrations/${id}/certificate`
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "certificate.pdf";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Cannot download certificate.");
    }
  }

  async function getUsers() {
  try {
    const response = await fetch(`${API}/users`, {
      headers: {
        "x-user-role": user.role
      }
    });

    const data = await response.json();
    setUsers(data);

    await getEvents();

    setPage("users");
  } catch {
    alert("Cannot load users.");
  }
}
  async function changeRole(id, role) {
    try {
      const response = await fetch(
        `${API}/users/${id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": user.role
          },
          body: JSON.stringify({ role })
        }
      );

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        getUsers();
      }
    } catch {
      alert("Cannot update role.");
    }
  }
  async function changeCreateEventPermission(userId, createEvents) {
  try {
    const response = await fetch(`${API}/users/${userId}/permissions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": user.role,
        "x-user-id": user.id
      },
      body: JSON.stringify({ createEvents })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update permission.");
      return;
    }

    alert("Create event permission updated.");
    getUsers();
  } catch {
    alert("Cannot update permission.");
  }
}
async function changeAttendanceAccess(
  userId,
  eventId,
  allowed
) {
  try {
    const response = await fetch(
      `${API}/users/${userId}/attendance-access`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
          "x-user-id": user.id
        },
        body: JSON.stringify({
          eventId,
          allowed
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
        "Failed to update attendance access."
      );
      return;
    }

    alert(data.message);
    getUsers();

  } catch {
    alert("Cannot update attendance access.");
  }
}

  return (
    <>
      <nav>
  <img
  src={eventCertLogo}
  alt="EventCert"
  className="eventcert-logo"
/>

  <button onClick={() => setPage("home")}>
    Home
  </button>

  <button
    onClick={() => {
      getEvents();
      setPage("events");
    }}
  >
    Events
  </button>

  {user && (
    <>
      <button onClick={getMyEvents}>
        My Events
      </button>

      <button onClick={getCertificates}>
        My Certificates
      </button>
    </>
  )}

  {user &&
  (user.role === "admin" ||
    user.role === "coordinator") && (
    <div className="management-menu">

      <button
        className="management-button"
        onClick={() =>
          setManagementOpen(!managementOpen)
        }
      >
        Management ▾
      </button>

      {managementOpen && (
        <div className="management-dropdown">

          {(user.role === "admin" ||
            (user.role === "coordinator" &&
              user.permissions?.createEvents)) && (
            <button
              onClick={() => {
                setPage("createEvent");
                setManagementOpen(false);
              }}
            >
              Create Event
            </button>
          )}

          <button
            onClick={() => {
              getRegistrations();
              setManagementOpen(false);
            }}
          >
            Attendance
          </button>

          {user.role === "admin" && (
            <button
              onClick={() => {
                getUsers();
                setManagementOpen(false);
              }}
            >
              Users
            </button>
          )}

        </div>
      )}

    </div>
  )}

  {!user ? (
    <>
      <button onClick={() => setPage("login")}>
        Login
      </button>

      <button onClick={() => setPage("register")}>
        Register
      </button>
    </>
  ) : (
    <div className="profile-menu">
      <button
        className="profile-button"
        onClick={() => setProfileOpen(!profileOpen)}
      >
         <span className="nav-profile-avatar">
  {user.name.charAt(0).toUpperCase()}
</span>


      </button>

      {profileOpen && (
        <div className="profile-dropdown">
          <p>
            <strong>{user.name}</strong>
          </p>

          <p>
            Role: <b>{user.role}</b>
          </p>

          <button
            onClick={() => {
              setPage("profile");
              setProfileOpen(false);
            }}
          >
            My Profile
          </button>

          <button
            onClick={() => {
              logout();
              setProfileOpen(false);
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )}
</nav>
      <main>

        {page === "home" && (
  <div className="dashboard">

    {!user ? (
      <div className="hero">
        <h1>EVENTCERT</h1>

        <h2>
          Event Registration and Certificate
          Management System
        </h2>

        <p>
          Register for events, track attendance and
          download your certificates.
        </p>

        <button onClick={() => setPage("events")}>
          Explore Events
        </button>

        <button onClick={() => setPage("login")}>
          Login
        </button>
      </div>
    ) : (
      <>
       <div className="dashboard-welcome">

  <div className="dashboard-welcome-text">
    <h1>Welcome back, {user.name}</h1>
    <p>Manage your events, registrations and certificates from here.</p>
  </div>

  <img
    src={certificateGirl}
    alt="Student holding a certificate"
    className="dashboard-welcome-image"
  />

</div>
       <div className="dashboard-section">

  <div className="dashboard-section-header">
    <h2>Quick Access</h2>
    <p>Everything you need to manage your EventCert activities.</p>
  </div>

  <div className="dashboard-grid">

    <div className="dashboard-card">
      <span className="dashboard-card-label">
        EVENTS
      </span>

      <h3>Browse Events</h3>

      <p>
        Explore upcoming events and register for
        the ones you are interested in.
      </p>

      <button
        onClick={() => {
          getEvents();
          setPage("events");
        }}
      >
        Explore Events
      </button>
    </div>

    <div className="dashboard-card">
      <span className="dashboard-card-label">
        REGISTRATIONS
      </span>

      <h3>My Events</h3>

      <p>
        View the events you have registered for and
        keep track of your participation.
      </p>

      <button onClick={getMyEvents}>
        View My Events
      </button>
    </div>

    <div className="dashboard-card">
      <span className="dashboard-card-label">
        CERTIFICATES
      </span>

      <h3>My Certificates</h3>

      <p>
        Access and download certificates for events
        you have attended.
      </p>

      <button onClick={getCertificates}>
        View Certificates
      </button>
    </div>

  </div>

</div>
      </>
    )}

  </div>
)}
{page === "profile" && user && (
  <div className="profile-page">

    <div className="profile-card">

      <div className="profile-header">

        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-heading">
          <h2>{user.name}</h2>
          <p>{user.role}</p>
        </div>

      </div>

      <div className="profile-details">

        <div className="profile-detail">
          <strong>Name</strong>
          <span>{user.name}</span>
        </div>

        <div className="profile-detail">
          <strong>Role</strong>
          <span>{user.role}</span>
        </div>

        <div className="profile-detail">
          <strong>Department</strong>
          <span>{user.department || "Not available"}</span>
        </div>

      </div>

    </div>

  </div>
)}
        {page === "login" && (
          <div className="card">
            <h2>Login</h2>

            <input
              type="email"
              placeholder="Email"
              value={login.email}
              onChange={(e) =>
                setLogin({
                  ...login,
                  email: e.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={login.password}
              onChange={(e) =>
                setLogin({
                  ...login,
                  password: e.target.value
                })
              }
            />

            <button onClick={handleLogin}>
              Login
            </button>
          </div>
        )}

        {page === "register" && (
          <div className="card">
            <h2>Create Account</h2>

            <input
              placeholder="Name"
              value={register.name}
              onChange={(e) =>
                setRegister({
                  ...register,
                  name: e.target.value
                })
              }
            />

            <input
              placeholder="Register Number"
              value={register.registerNumber}
              onChange={(e) =>
                setRegister({
                  ...register,
                  registerNumber: e.target.value
                })
              }
            />

            <input
              placeholder="Department"
              value={register.department}
              onChange={(e) =>
                setRegister({
                  ...register,
                  department: e.target.value
                })
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={register.email}
              onChange={(e) =>
                setRegister({
                  ...register,
                  email: e.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={register.password}
              onChange={(e) =>
                setRegister({
                  ...register,
                  password: e.target.value
                })
              }
            />

            <button onClick={handleRegister}>
              Register
            </button>
          </div>
        )}

        {page === "events" && (
  <div className="events-page">

    <div className="events-header">
      <div>
        <h2>Discover Events</h2>
        <p>
          Explore upcoming events and register for the ones
          you don't want to miss.
        </p>
        <input
  type="text"
  placeholder="🔍 Search events..."
  value={eventSearch}
  onChange={(e) => setEventSearch(e.target.value)}
  className="event-search"
/>
<select
  value={eventCategory}
  onChange={(e) => setEventCategory(e.target.value)}
  className="event-category-filter"
>
  <option value="All">All Categories</option>
  <option value="Workshop">Workshop</option>
  <option value="Hackathon">Hackathon</option>
  <option value="Seminar">Seminar</option>
  <option value="Competition">Competition</option>
  <option value="Other">Other</option>
</select>
      </div>
    </div>

    <div className="events">
      {events.length === 0 ? (
        <div className="empty-events">
          <h3>No events available</h3>
          <p>
            There are no events available right now.
          </p>
        </div>
      ) : (
       events.filter((item) => {
  const matchesSearch = item.name
    .toLowerCase()
    .includes(eventSearch.toLowerCase());

  const matchesCategory =
    eventCategory === "All" ||
    item.category === eventCategory;

  return matchesSearch && matchesCategory;
})
  .map((item) => (
         <div
  className="event"
  key={item._id}
  onClick={() => setSelectedEvent(item)}
>
            <div className="event-icon">
              EVENT
            </div>

            <h3>{item.name}</h3>

            <p className="event-description">
              {item.description}
            </p>

            <div className="event-info">

              <p>
                 <b>Date:</b>{" "}
                {new Date(
                  item.date
                ).toLocaleDateString()}
              </p>

              <p>
                 <b>Venue:</b> {item.venue}
              </p>
              <p>
   <b>Category:</b> {item.category || "Other"}
</p>
            </div>

<button
  onClick={() => registerForEvent(item._id)}
  disabled={
    new Date(item.date) < new Date() ||
    isRegisteredForEvent(item._id)
  }
>
  {new Date(item.date) < new Date()
    ? "Registration Closed"
    : isRegisteredForEvent(item._id)
    ? "Registered"
    : "Register for Event"}
</button>

          </div>
        ))
      )}
    </div>

  </div>
)}
{selectedEvent && (
  <div className="event-details-overlay">
    <div className="event-details-card">

      <button
        className="event-details-close"
        onClick={() => setSelectedEvent(null)}
      >
        ✕
      </button>

      <div className="event-icon">
        
      </div>

      <h2>{selectedEvent.name}</h2>

      <p className="event-details-description">
        {selectedEvent.description}
      </p>

      <div className="event-details-info">

        <p>
           <b>Date:</b>{" "}
          {new Date(selectedEvent.date).toLocaleDateString()}
        </p>

        <p>
           <b>Venue:</b> {selectedEvent.venue}
        </p>

        <p>
           <b>Category:</b>{" "}
          {selectedEvent.category || "Other"}
        </p>

   


      </div>

     <button
  onClick={() => registerForEvent(selectedEvent._id)}
  disabled={isRegisteredForEvent(selectedEvent._id)}
>
  {isRegisteredForEvent(selectedEvent._id)
    ? "✅ Registered"
    : "Register for Event"}
</button>
    </div>
  </div>
)}

        {page === "myEvents" && (
          <div className="my-events-page">
            <h2 className="my-events-title">My Events</h2>
            <p className="my-events-subtitle">
  Events you have registered for
</p>

            {myEvents.length === 0 ? (
              <p>No event registrations found.</p>
            ) : (
              myEvents.map((item) => (
  <div className="my-event-card" key={item._id}>

    <div className="my-event-info">

      <h3>{item.event.name}</h3>

      <p className="event-detail">
        Date:{" "}
        {new Date(
          item.event.date
        ).toLocaleDateString()}
      </p>

      <p
        className={
          new Date(item.event.date) >= new Date()
            ? "event-status upcoming"
            : "event-status ended"
        }
      >
        <span className="status-dot">●</span>{" "}
        {new Date(item.event.date) >= new Date()
          ? "Upcoming"
          : "Event ended"}
      </p>

      <p className="event-detail">
        Venue: {item.event.venue || "Not specified"}
      </p>

      <p className="event-detail">
        Category: {item.event.category || "Other"}
      </p>

      <p className="attendance-status">
        Attendance:{" "}
        <b
          className={
            item.attended
              ? "attendance-present"
              : "attendance-not-marked"
          }
        >
          {item.attended
            ? "✓ Present"
            : "○ Not marked"}
        </b>
      </p>

    </div>

    {item.attended ? (
      <button
        className="certificate-download-button"
        onClick={() =>
          downloadCertificate(item._id)
        }
      >
        Download Certificate
      </button>
    ) : (
      <p className="certificate-status">
        Certificate:{" "}
        <b>Available after attendance</b>
      </p>
    )}

  </div>
))
            )}
          </div>
        )}
       {page === "certificates" && (
  <div className="my-certificates-page">

    <h2 className="my-certificates-title">
      My Certificates
    </h2>

    <p className="my-certificates-subtitle">
      Certificates earned from events you have attended
    </p>

    {certificates.length === 0 ? (
  <p>No certificates available.</p>
) : (
  <div className="my-certificates-list">

    {certificates.map((item) => (
        <div className="my-certificate-card" key={item._id}>
          <div className="my-certificate-info">
          <h3>{item.event.name}</h3>

          <p>
            Date:{" "}
            {new Date(
              item.event.date
            ).toLocaleDateString()}
          </p>

         <p>
  Venue: {item.event.venue || "Not specified"}
</p>

          <p>
            Attendance: <b>Present</b>
          </p></div>

          <button className="certificate-download-button"
            onClick={() =>
              downloadCertificate(item._id)
            }
          >
            Download Certificate
          </button>
     </div>
  ))}
</div>
)}
  </div>
)}

        {page === "createEvent" && (
          <div className="card">
            <h2>Create Event</h2>

            <input
              placeholder="Event Name"
              value={event.name}
              onChange={(e) =>
                setEvent({
                  ...event,
                  name: e.target.value
                })
              }
            />

            <textarea
              placeholder="Event Description"
              value={event.description}
              onChange={(e) =>
                setEvent({
                  ...event,
                  description: e.target.value
                })
              }
            />
            <input
  type="number"
  min="1"
  placeholder="Maximum participants"
  value={event.capacity}
  onChange={(e) =>
    setEvent({
      ...event,
      capacity: Number(e.target.value)
    })
  }
/>

            <input
              type="date"
              value={event.date}
              onChange={(e) =>
                setEvent({
                  ...event,
                  date: e.target.value
                })
              }
            />

            <input
              placeholder="Venue"
              value={event.venue}
              onChange={(e) =>
                setEvent({
                  ...event,
                  venue: e.target.value
                })
              }
            />
            <select
  value={event.category}
  onChange={(e) =>
    setEvent({
      ...event,
      category: e.target.value
    })
  }
>
  <option value="Workshop">
    Workshop
  </option>

  <option value="Hackathon">
    Hackathon
  </option>

  <option value="Seminar">
    Seminar
  </option>

  <option value="Competition">
    Competition
  </option>

  <option value="Other">
    Other
  </option>
</select>
            <select
              value={event.certificateTemplate}
              onChange={(e) =>
                setEvent({
                  ...event,
                  certificateTemplate: e.target.value
                })
              }
            >
              <option value="template1">
                Certificate Template 1
              </option>

              <option value="template2">
                Certificate Template 2
              </option>

              <option value="template3">
                Certificate Template 3
              </option>
            </select>

            <button onClick={createEvent}>
              Create Event
            </button>
          </div>
        )}

       {page === "attendance" && (
 <div className="attendance-page">
  <div className="attendance-header">
    <h2>Attendance Management</h2>
    <p>Manage participant attendance for your events.</p>
  </div>

    {/* EVENT SELECTION */}
    <div className="attendance-selector">
  <h3>Select Event</h3>
      <select
        value={selectedAttendanceEvent}
        onChange={(e) => {
          setSelectedAttendanceEvent(e.target.value);
          setAttendanceSearch("");
          setAttendanceFilter("all");
        }}
      >
        <option value="">
          Select an event
        </option>

        {events.map((event) => (
  <option
    key={event._id}
    value={event._id}
  >
    {event.name}
  </option>
))}
      </select>
    </div>

    {/* SHOW ONLY AFTER EVENT IS SELECTED */}
    {selectedAttendanceEvent && (() => {

      const selectedEvent =
  events.find(
    (event) =>
      event._id === selectedAttendanceEvent
  );

      const eventRegistrations =
        allRegistrations.filter(
          (item) =>
            item.event &&
            item.event._id === selectedAttendanceEvent
        );

      const presentCount =
        eventRegistrations.filter(
          (item) => item.attended
        ).length;

      const notMarkedCount =
        eventRegistrations.length -
        presentCount;

      const filteredRegistrations =
        eventRegistrations.filter((item) => {

          const matchesSearch =
            item.user.name
              .toLowerCase()
              .includes(
                attendanceSearch.toLowerCase()
              ) ||
            item.user.registerNumber
              .toLowerCase()
              .includes(
                attendanceSearch.toLowerCase()
              );

          const matchesFilter =
            attendanceFilter === "all" ||
            (attendanceFilter === "present" &&
              item.attended) ||
            (attendanceFilter === "notMarked" &&
              !item.attended);

          return matchesSearch && matchesFilter;
        });

      return (
        <>
          {/* EVENT SUMMARY */}
          <div className="attendance-selector">
  <h3>{selectedEvent.name}</h3>

            <p>
              Date:{" "}
              {new Date(
                selectedEvent.date
              ).toLocaleDateString()}
            </p>

            <p>
              Venue:{" "}
              {selectedEvent.venue || "Not specified"}
            </p>

            <p>
              Capacity:{" "}
              {selectedEvent.capacity}
            </p>

            <hr />

            <div className="attendance-stats">

  <div className="attendance-stat">
    <h3>Registered</h3>
    <strong>{eventRegistrations.length}</strong>
  </div>

  <div className="attendance-stat">
    <h3>Present</h3>
    <strong>{presentCount}</strong>
  </div>

  <div className="attendance-stat">
    <h3>Not Marked</h3>
    <strong>{notMarkedCount}</strong>
  </div>

</div>
            
          </div>

          {/* SEARCH + FILTER */}
<div className="attendance-controls">

  <input
    type="text"
    placeholder="Search by name or register number"
    value={attendanceSearch}
    onChange={(e) =>
      setAttendanceSearch(e.target.value)
    }
  />

  <div className="attendance-filter-buttons">
    <button
  onClick={exportAttendanceToExcel}
>
  Export to Excel
</button>

    <button
      onClick={() =>
        setAttendanceFilter("all")
      }
    >
      All
    </button>

    <button
      onClick={() =>
        setAttendanceFilter("present")
      }
    >
      Present
    </button>

    <button
      onClick={() =>
        setAttendanceFilter("notMarked")
      }
    >
      Not Marked
    </button>

  </div>

</div>

{/* PARTICIPANTS */}

{filteredRegistrations.length > 0 ? (
  <div className="attendance-table-wrapper">

    <table className="attendance-table">

      <thead>
        <tr>
          <th>Participant</th>
          <th>Register Number</th>
          <th>Department</th>
          <th>Attendance</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        {filteredRegistrations.map((item) => (
          <tr key={item._id}>

            <td>
              <strong>
                {item.user.name}
              </strong>
            </td>

            <td>
              {item.user.registerNumber}
            </td>

            <td>
              {item.user.department}
            </td>

            <td>
              <span
                className={
                  item.attended
                    ? "attendance-present"
                    : "attendance-not-marked"
                }
              >
                {item.attended
                  ? "Present"
                  : "Not marked"}
              </span>
            </td>

            <td>
              {!item.attended ? (
                <button
                  onClick={() =>
                    markAttendance(item._id)
                  }
                >
                  Mark Present
                </button>
              ) : (
                <span className="attendance-done">
                  ✓ Done
                </span>
              )}
            </td>

          </tr>
        ))}

      </tbody>

    </table>

  </div>
) : (
  <p>
    No participants found.
  </p>
)}
        </>
      );

    })()}
  </div>
)}
        {page === "users" && (
          <div>
            <h2>User Management</h2>

            {users.map((item) => (
              <div className="event" key={item._id}>
                <h3>{item.name}</h3>

                <p>{item.email}</p>

                <p>
                  Register Number:{" "}
                  {item.registerNumber}
                </p>

                <p>
                  Current Role: <b>{item.role}</b>
                </p>

                <select
                  value={item.role}
                  onChange={(e) =>
                    changeRole(
                      item._id,
                      e.target.value
                    )
                  }
                >
                  <option value="participant">
                    Participant
                  </option>

                  <option value="coordinator">
                    Coordinator
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
               
{item.role === "coordinator" && (
  <button
    onClick={() =>
      changeCreateEventPermission(
        item._id,
        !item.permissions?.createEvents
      )
    }
  >
    {item.permissions?.createEvents
      ? "Revoke Event Creation"
      : "Allow Event Creation"}
  </button>

)}
{item.role === "coordinator" && (
  <div>
    <p>Attendance Access:</p>

    {events.map((event) => {
      const hasAccess =
        item.attendanceEvents?.some(
          (id) => id === event._id
        );

      return (
        <label
          key={event._id}
          style={{
            display: "block",
            marginBottom: "5px"
          }}
        >
          <input
            type="checkbox"
            checked={hasAccess}
            onChange={(e) =>
              changeAttendanceAccess(
                item._id,
                event._id,
                e.target.checked
              )
            }
          />

          {" "}{event.name}
        </label>
      );
    })}
  </div>
)}
              </div>
            ))}
          </div>
        )}

      </main>

      <footer>
        EVENTCERT © 2026
      </footer>
    </>
  );
}

export default App;