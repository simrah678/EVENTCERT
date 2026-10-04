import { useEffect, useState } from "react";
import eventCertLogo from "./assets/EventCert-logo.png";
import certificateGirl from "./assets/certificate-girl.png";
import "./App.css";
import * as XLSX from "xlsx";

const API = "https://eventcert-6opf.onrender.com";

function App() {
  const [page, setPage] = useState("home");
  const [sharedEvent, setSharedEvent] = useState(null);
  const [createdEventLink, setCreatedEventLink] = useState("");
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = "success") => {
  setNotification({
    message,
    type
  });

  setTimeout(() => {
    setNotification(null);
  }, 3000);
};
  const [profileOpen, setProfileOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
const [userRoleFilter, setUserRoleFilter] = useState("all");
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

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event");

  if (eventId) {
    setSharedEvent(eventId);
  }
}, []);
useEffect(() => {
  if (!sharedEvent || events.length === 0) {
    return;
  }

  const foundEvent = events.find(
    (item) => item._id === sharedEvent
  );

  if (foundEvent) {
    setSelectedEvent(foundEvent);
    setPage("events");
  }
}, [sharedEvent, events]);

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
        showNotification("Registration successful!");
        setPage("login");
      } else {
         showNotification(data.message,"error");
      }
    } catch {
      showNotification("Cannot connect to backend.","error");
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
        showNotification(data.message,"error");
        return;
      }

      localStorage.setItem(
        "eventcertUser",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setPage("home");
    } catch {
      showNotification("Cannot connect to backend.","error");
    }
  }

  function logout() {
    localStorage.removeItem("eventcertUser");
    setUser(null);
    setPage("home");
  }

  async function registerForEvent(eventId) {
  if (!user) {
    showNotification("Please login first.","error");
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

if (response.ok) {

  showNotification(data.message);

  const myEventsResponse = await fetch(
    `${API}/users/${user.id}/registrations`
  );

  const myEventsData = await myEventsResponse.json();

  setMyEvents(myEventsData);

} else {

  showNotification(data.message, "error");


    }

  } catch {
    showNotification("Cannot connect to backend.","error");
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
      showNotification("Cannot load registrations.","error");
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
    showNotification("Cannot load certificates.","error");
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
  await getEvents();

  const newEventsResponse = await fetch(`${API}/events`);
  const newEvents = await newEventsResponse.json();

  const createdEvent = newEvents
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

  if (createdEvent && createdEvent._id) {
    const registrationLink =
      `${window.location.origin}/?event=${createdEvent._id}`;

    setCreatedEventLink(registrationLink);
  }

  setEvent({
  name: "",
  description: "",
  capacity: 100,
  date: "",
  venue: "",
  category: "Other",
  certificateTemplate: "template1"
});
}else {
        showNotification(data.message,"error");
      }
    } catch {
      showNotification("Cannot connect to backend.","error");
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
      showNotification("Cannot load registrations.","error");
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
        showNotification("Attendance marked!");
        getRegistrations();
      } else {
        showNotification(data.message,"error");
      }
    } catch {
      showNotification("Cannot connect to backend.","error");
    }
  }
  function exportAttendanceToExcel() {
  if (!selectedAttendanceEvent) {
    showNotification("Please select an event first.","error");
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
    showNotification("Event not found.","error");
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
        showNotification(data.message,"error");
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
      showNotification("Cannot download certificate.","error");
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
    showNotification("Cannot load users.","error");
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

if (response.ok) {
  showNotification(data.message);
  getUsers();
} else {
  showNotification(data.message, "error");
}
    } catch {
      showNotification("Cannot update role.","error");
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
  showNotification(
    data.message || "Failed to update permission.",
    "error"
  );
  return;
}

    showNotification("Create event permission updated.");
    getUsers();
  } catch {
    showNotification("Cannot update permission.","error");
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
  showNotification(
    data.message ||
    "Failed to update attendance access.",
    "error"
  );
  return;
}

   showNotification(data.message);
getUsers();

  } catch {
    showNotification("Cannot update attendance access.","error");
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
  <div className="home-page">

    <section className="home-hero">

      <div className="home-hero-content">

        <span className="home-eyebrow">
          COLLEGE EVENT MANAGEMENT
        </span>

        <h1>
          Everything for your events,
          <span> in one place.</span>
        </h1>

        <p>
          Discover college events, register with ease,
          track your participation and access your
          certificates — all through EventCert.
        </p>

        <div className="home-hero-actions">

          <button
            className="home-primary-button"
            onClick={() => {
              getEvents();
              setPage("events");
            }}
          >
            Explore Events
          </button>

          <button
            className="home-secondary-button"
            onClick={() => setPage("register")}
          >
            Create Account
          </button>

        </div>

      </div>

      <div className="home-hero-visual">

        <div className="home-visual-card">

          <div className="home-visual-header">
            <span>EVENTCERT</span>
            <span className="home-visual-status">
              LIVE
            </span>
          </div>

          <div className="home-visual-event">

            <span className="home-visual-label">
              UPCOMING EVENT
            </span>

            <h3>
              Discover. Participate.
              Achieve.
            </h3>

            <p>
              Your next college experience
              starts here.
            </p>

          </div>

          <div className="home-visual-details">

            <div>
              <strong>Events</strong>
              <span>Discover</span>
            </div>

            <div>
              <strong>Registration</strong>
              <span>Easy &amp; Fast</span>
            </div>

            <div>
              <strong>Certificates</strong>
              <span>Digital Access</span>
            </div>

          </div>

        </div>

      </div>

    </section>

    <section className="home-features">

      <div className="home-section-heading">
        <span>WHY EVENTCERT</span>

        <h2>
          A simpler way to manage
          college events.
        </h2>

        <p>
          From registration to certification,
          EventCert keeps everything organized.
        </p>
      </div>

      <div className="home-feature-grid">

        <div className="home-feature-card">
          <span className="home-feature-number">
            01
          </span>

          <h3>Discover Events</h3>

          <p>
            Browse upcoming workshops, seminars,
            competitions and other college events.
          </p>
        </div>

        <div className="home-feature-card">
          <span className="home-feature-number">
            02
          </span>

          <h3>Register Easily</h3>

          <p>
            Register for events and keep track of
            everything you have signed up for.
          </p>
        </div>

        <div className="home-feature-card">
          <span className="home-feature-number">
            03
          </span>

          <h3>Get Certified</h3>

          <p>
            Once your attendance is confirmed,
            access your participation certificates.
          </p>
        </div>

      </div>

    </section>

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
{notification && (
  <div className={`eventcert-notification ${notification.type}`}>
    <span className="notification-check">
      {notification.type === "error" ? "!" : "✓"}
    </span>

    <span>{notification.message}</span>
  </div>
  )}
       {page === "login" && (
<div className="auth-page">

  <div className="auth-visual-panel">
    <div className="auth-brand">
  <img
  src={eventCertLogo}
  alt="EventCert"
  className="auth-logo"
/>
</div>

    <div className="auth-visual-content">
      <h2>Everything for your events, in one place.</h2>
      <p>
        Discover events, manage registrations and access
        your certificates with ease.
      </p>
    </div>
  </div>

  <div className="auth-card">

      <div className="auth-header">
        <h1>EventCert</h1>
        <h2>Welcome back</h2>
        <p>Sign in to continue to your account.</p>
      </div>

      <div className="auth-form">

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={login.email}
            onChange={(e) =>
              setLogin({
                ...login,
                email: e.target.value
              })
            }
          />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={login.password}
            onChange={(e) =>
              setLogin({
                ...login,
                password: e.target.value
              })
            }
          />
        </div>

        <button
          className="auth-submit-button"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>

      <div className="auth-footer">
        <p>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => setPage("register")}
          >
            Create one
          </button>
        </p>
      </div>

    </div>

  </div>
)}

{page === "register" && (
 <div className="auth-page register-auth-page">

    <div className="auth-visual-panel">

      <div className="auth-brand">
        <img
          src={eventCertLogo}
          alt="EventCert"
          className="auth-logo"
        />
      </div>

      <div className="auth-visual-content">
        <h2>
          Everything for your events,
          in one place.
        </h2>

        <p>
          Discover events, participate with ease,
          and get certified for your achievements.
        </p>
      </div>

    </div>

    <div className="auth-card register-card">

      <div className="auth-header">
        <h1>EventCert</h1>
        <h2>Create your account</h2>
        <p>Join EventCert to discover and manage college events.</p>
      </div>

      <div className="auth-form">

        <div className="auth-field">
          <label>Name</label>
          <input
            placeholder="Enter your full name"
            value={register.name}
            onChange={(e) =>
              setRegister({
                ...register,
                name: e.target.value
              })
            }
          />
        </div>

        <div className="auth-field">
          <label>Register Number</label>
          <input
            placeholder="Enter your register number"
            value={register.registerNumber}
            onChange={(e) =>
              setRegister({
                ...register,
                registerNumber: e.target.value
              })
            }
          />
        </div>

        <div className="auth-field">
          <label>Department</label>
          <input
            placeholder="Enter your department"
            value={register.department}
            onChange={(e) =>
              setRegister({
                ...register,
                department: e.target.value
              })
            }
          />
        </div>

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={register.email}
            onChange={(e) =>
              setRegister({
                ...register,
                email: e.target.value
              })
            }
          />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={register.password}
            onChange={(e) =>
              setRegister({
                ...register,
                password: e.target.value
              })
            }
          />
        </div>

        <button
          className="auth-submit-button"
          onClick={handleRegister}
        >
          Create Account
        </button>

      </div>

      <div className="auth-footer">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setPage("login")}
          >
            Login
          </button>
        </p>
      </div>

    </div>

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
  <div className="create-event-page">

    <div className="create-event-card">

      <div className="create-event-header">
        <h2>Create New Event</h2>
        <p>Add the details for your event</p>
      </div>

      <div className="create-event-content">

        {/* LEFT SIDE — EVENT DETAILS */}
        <div className="create-event-details">

          <div className="create-event-field full-width">
            <label>Event Name</label>

            <input
              type="text"
              placeholder="Enter event name"
              value={event.name}
              onChange={(e) =>
                setEvent({
                  ...event,
                  name: e.target.value
                })
              }
            />
          </div>


          <div className="create-event-row">

            <div className="create-event-field">
              <label>Event Date</label>

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
            </div>


            <div className="create-event-field">
              <label>Maximum Participants</label>

              <input
                type="number"
                min="1"
                placeholder="100"
                value={event.capacity}
                onChange={(e) =>
                  setEvent({
                    ...event,
                    capacity: Number(e.target.value)
                  })
                }
              />
            </div>

          </div>


          <div className="create-event-field full-width">
            <label>Venue</label>

            <input
              type="text"
              placeholder="Enter event venue"
              value={event.venue}
              onChange={(e) =>
                setEvent({
                  ...event,
                  venue: e.target.value
                })
              }
            />
          </div>


          <div className="create-event-row">

            <div className="create-event-field">
              <label>Event Category</label>

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
            </div>


            <div className="create-event-field">
              <label>Certificate Template</label>

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
                  Template 1
                </option>

                <option value="template2">
                  Template 2
                </option>

                <option value="template3">
                  Template 3
                </option>
              </select>
            </div>

          </div>

        </div>


        {/* RIGHT SIDE — EVENT DESCRIPTION */}
        <div className="create-event-description">

          <div className="create-event-field description-field">
            <label>About Event</label>

            <textarea
              placeholder="Tell students about this event..."
              value={event.description}
              onChange={(e) =>
                setEvent({
                  ...event,
                  description: e.target.value
                })
              }
            />
          </div>

        </div>

      </div>


      {/* ACTIONS */}
      <div className="create-event-actions">

        <button
          type="button"
          className="create-event-cancel"
          onClick={() => setPage("dashboard")}
        >
          Cancel
        </button>

        <button
          type="button"
          className="create-event-submit"
          onClick={createEvent}
        >
          Create Event
        </button>

      </div>
      {createdEventLink && (
  <div className="registration-link-box">
    <div className="registration-link-content">
      <strong>Event created successfully</strong>
      <p>Share this link with students to register for the event.</p>

      <div className="registration-link-row">
        <input
          type="text"
          value={createdEventLink}
          readOnly
        />

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(createdEventLink);
           showNotification("Registration link copied!");
          }}
        >
          Copy Link
        </button>
      </div>
    </div>
  </div>
)}
    </div>

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
  <div className="users-page">

    <div className="users-header">
      <div>
        <h2>User Management</h2>
        <p>
          Manage user roles, permissions and attendance access.
        </p>
      </div>
    </div>

    <div className="users-filters">

      <input
        type="text"
        placeholder="Search users..."
        value={userSearch}
        onChange={(e) =>
          setUserSearch(e.target.value)
        }
      />

      <select
        value={userRoleFilter}
        onChange={(e) =>
          setUserRoleFilter(e.target.value)
        }
      >
        <option value="all">All Roles</option>
        <option value="participant">Participants</option>
        <option value="coordinator">Coordinators</option>
        <option value="admin">Admins</option>
      </select>

    </div>

    <div className="users-list">

      {users
        .filter((item) => {
          const search = userSearch.toLowerCase();

          const matchesSearch =
            item.name.toLowerCase().includes(search) ||
            item.email.toLowerCase().includes(search) ||
            item.registerNumber
              .toLowerCase()
              .includes(search);

          const matchesRole =
            userRoleFilter === "all" ||
            item.role === userRoleFilter;

          return matchesSearch && matchesRole;
        })
        .map((item) => (

          <div
            className="user-card"
            key={item._id}
          >

            <div className="user-main">

              <div className="user-avatar">
                {item.name.charAt(0).toUpperCase()}
              </div>

              <div className="user-info">

                <h3>{item.name}</h3>

                <p>{item.email}</p>

                <span>
                  {item.registerNumber}
                </span>

              </div>

            </div>

            <div className="user-role">
              <span
                className={`role-badge ${item.role}`}
              >
                {item.role}
              </span>
            </div>

            <div className="user-actions">

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

            </div>

            {item.role === "coordinator" && (
              <div className="coordinator-controls">

                <div className="permission-section">

                  <h4>Coordinator Permissions</h4>

                  <button
                    className={
                      item.permissions?.createEvents
                        ? "permission-button allowed"
                        : "permission-button"
                    }
                    onClick={() =>
                      changeCreateEventPermission(
                        item._id,
                        !item.permissions?.createEvents
                      )
                    }
                  >
                    {item.permissions?.createEvents
                      ? "Event Creation Allowed"
                      : "Allow Event Creation"}
                  </button>

                </div>

                <div className="attendance-section">

                  <h4>Attendance Access</h4>

                  <select
                    className="attendance-event-select"
                    defaultValue=""
                    onChange={(e) => {
                      const eventId =
                        e.target.value;

                      if (!eventId) return;

                      const hasAccess =
                        item.attendanceEvents?.some(
                          (id) => id === eventId
                        );

                      changeAttendanceAccess(
                        item._id,
                        eventId,
                        !hasAccess
                      );

                      e.target.value = "";
                    }}
                  >

                    <option value="">
                      Select an event
                    </option>

                    {events.map((event) => {

                      const hasAccess =
                        item.attendanceEvents?.some(
                          (id) => id === event._id
                        );

                      return (
                        <option
                          key={event._id}
                          value={event._id}
                        >
                          {hasAccess
                            ? `✓ ${event.name} — Access granted`
                            : event.name}
                        </option>
                      );
                    })}

                  </select>

                  <div className="attendance-access-list">

                    {events
                      .filter((event) =>
                        item.attendanceEvents?.some(
                          (id) => id === event._id
                        )
                      )
                      .map((event) => (

                        <span
                          key={event._id}
                          className="attendance-access-tag"
                        >
                          {event.name}
                        </span>

                      ))}

                  </div>

                </div>

              </div>
            )}

          </div>

        ))}

    </div>

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