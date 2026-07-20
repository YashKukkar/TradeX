import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SupportTickets.module.css";
import { useMyTickets } from "./hooks/useTickets";
import Icon from "./components/Icon";
import CreateTicketModal from "./components/CreateTicketModal";
import TicketDetailModal from "./components/TicketDetailModal";
import StatCard from "./components/StatCard";
import Card from "./components/Card";
import { formatDateTime } from "./utils/dashboardHelpers";
import Toast from "./components/Toast";



export default function SupportTickets() {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading, error } = useMyTickets();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  useEffect(() => {
    if (error) {
      navigate("/login");
    }
  }, [error, navigate]);

  // Compute stat metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;



  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  // Status colors are globally configured in index.css



  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text)",
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
          >
            <Icon name="arrow_back" style={{ fontSize: "18px" }} />
            Dashboard
          </button>
          <div className={styles.titleSection}>
            <h1>Support Tickets</h1>
            <p>Need assistance? Raise a support ticket and track its resolution.</p>
          </div>
        </div>
        {(() => {
          const activeTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
          const isCreateDisabled = activeTicketsCount >= 3;
          return (
            <button 
              className={styles.createBtn} 
              onClick={() => setCreateModalOpen(true)}
              disabled={isCreateDisabled}
              style={isCreateDisabled ? {
                opacity: 0.5,
                cursor: "not-allowed",
                background: "var(--surface-3)",
                color: "var(--muted)"
              } : undefined}
            >
              <Icon name="add" />
              Raise Ticket
            </button>
          );
        })()}
      </header>

      {(() => {
        const activeTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
        if (activeTicketsCount >= 3) {
          return (
            <div style={{
              background: "rgba(255, 179, 0, 0.1)",
              border: "1px solid rgba(255, 179, 0, 0.2)",
              color: "#ffb300",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <Icon name="warning" style={{ fontSize: "20px" }} />
              <span>You currently have {activeTicketsCount} active support tickets. You must wait for them to be resolved before raising a new one.</span>
            </div>
          );
        }
        return null;
      })()}

      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="confirmation_number"
          label="Total Raised"
          value={totalCount}
          isLoading={isLoading}
        />
        <StatCard
          icon="hourglass_empty"
          label="Active Tickets"
          value={openCount}
          iconColor="var(--accent)"
          valueColor="var(--accent)"
          isLoading={isLoading}
        />
        <StatCard
          icon="task_alt"
          label="Resolved Tickets"
          value={resolvedCount}
          iconColor="#06b6d4"
          valueColor="#06b6d4"
          isLoading={isLoading}
        />
        <StatCard
          icon="check_circle"
          label="Closed Tickets"
          value={closedCount}
          iconColor="var(--muted)"
          valueColor="var(--muted)"
          isLoading={isLoading}
        />

      </div>



      {/* Main Content Layout */}
      <div className={styles.contentGrid}>
        {/* Filters Sidebar */}
        <Card className={styles.filterCard}>
          <div className={styles.filterGroup}>

            <h4>Filter Status</h4>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "ALL" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              <span>All Tickets</span>
              <span className={styles.filterCount}>{totalCount}</span>
            </button>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "OPEN" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("OPEN")}
            >
              <span>Open</span>
              <span className={styles.filterCount}>{tickets.filter(t => t.status === "OPEN").length}</span>
            </button>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "IN_PROGRESS" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("IN_PROGRESS")}
            >
              <span>In Progress</span>
              <span className={styles.filterCount}>{tickets.filter(t => t.status === "IN_PROGRESS").length}</span>
            </button>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "RESOLVED" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("RESOLVED")}
            >
              <span>Resolved</span>
              <span className={styles.filterCount}>{resolvedCount}</span>
            </button>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "CLOSED" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("CLOSED")}
            >
              <span>Closed</span>
              <span className={styles.filterCount}>{closedCount}</span>
            </button>

          </div>


          <div className={styles.filterGroup}>
            <h4>Filter Category</h4>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "10px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text)",
                fontSize: "13px",
                outline: "none"
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="ACCOUNT_ISSUE">Account Issue</option>
              <option value="PAYMENT_ISSUE">Payment Issue</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </Card>


        {/* Tickets Listing */}
        <main className={styles.ticketsSection}>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
              <Icon name="progress_activity" className="spin" style={{ fontSize: "36px", marginBottom: "12px" }} />
              <p>Loading support tickets...</p>
            </div>
          )}

          {!isLoading && filteredTickets.length === 0 && (
            <div className={styles.noTickets}>
              <Icon name="chat_bubble_outline" style={{ fontSize: "40px", color: "var(--muted)" }} />
              <p style={{ margin: 0, fontWeight: "500" }}>No support tickets found</p>
              <p style={{ margin: 0, fontSize: "13px" }}>
                {tickets.length === 0 
                  ? "You haven't raised any tickets yet. Click 'Raise Ticket' to start." 
                  : "No tickets match your filter criteria."}
              </p>
            </div>
          )}

          {!isLoading && filteredTickets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={styles.ticketCard}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className={styles.ticketMeta}>
                    <span className={styles.ticketId}>{ticket.ticketNumber}</span>
                    <span className={`${styles.categoryTag} category-tag-${ticket.category.toLowerCase().replace("_", "")}`}>
                      {ticket.category.replace("_", " ")}
                    </span>
                  </div>
                  <div className={styles.ticketMain}>
                    <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                    <span className={styles.ticketTime}>
                      Updated {formatDateTime(ticket.updatedAt)}
                    </span>

                  </div>
                  <div className={styles.ticketActions}>
                    <span className={`${styles.statusBadge} status-pill-${ticket.status.toLowerCase().replace("_", "")}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <Icon name="chevron_right" style={{ color: "var(--muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onSuccess={(warning) => {
          if (warning) {
            setToast({ message: warning, type: "warning" });
          } else {
            setToast({ message: "Support ticket created successfully.", type: "success" });
          }
        }}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal 
        isOpen={selectedTicketId !== null} 
        onClose={() => setSelectedTicketId(null)} 
        ticketId={selectedTicketId}
        isAdmin={false}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
