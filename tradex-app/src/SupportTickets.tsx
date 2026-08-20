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
import { getTicketSlaInfo } from "./utils/slaHelpers";
import { useToast } from "./context/ToastContext";



export default function SupportTickets() {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading, error } = useMyTickets();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const { showToast } = useToast();

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

      {/* Stats Summary Bar */}
      <div className={styles.statsRow}>
        <StatCard
          icon="confirmation_number"
          label="Total Tickets"
          value={totalCount}
          isLoading={isLoading}
        />
        <StatCard
          icon="pending_actions"
          label="In Progress / Open"
          value={openCount}
          isLoading={isLoading}
          valueColor={openCount > 0 ? "var(--warning)" : undefined}
        />
        <StatCard
          icon="check_circle"
          label="Resolved"
          value={resolvedCount}
          isLoading={isLoading}
          valueColor={resolvedCount > 0 ? "var(--success)" : undefined}
        />
        <StatCard
          icon="archive"
          label="Closed"
          value={closedCount}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Layout */}
      <div className={styles.layout}>
        {/* Left Filters Sidebar */}
        <Card className={styles.filterSidebar}>
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
              <span className={styles.filterCount}>
                {tickets.filter((t) => t.status === "OPEN").length}
              </span>
            </button>
            <button 
              className={`${styles.filterBtn} ${statusFilter === "IN_PROGRESS" ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter("IN_PROGRESS")}
            >
              <span>In Progress</span>
              <span className={styles.filterCount}>
                {tickets.filter((t) => t.status === "IN_PROGRESS").length}
              </span>
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
              {filteredTickets.map((ticket) => {
                const sla = getTicketSlaInfo(ticket.createdAt, ticket.status, ticket.resolvedAt);
                return (
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
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span className={styles.ticketTime}>
                          Updated {formatDateTime(ticket.updatedAt)}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            color: sla.color,
                            background: sla.bg,
                            border: `1px solid ${sla.border}`,
                          }}
                        >
                          <Icon name={sla.icon} style={{ fontSize: "12px" }} />
                          {sla.label}
                        </span>
                      </div>
                    </div>
                    <div className={styles.ticketActions}>
                      <span className={`${styles.statusBadge} status-pill-${ticket.status.toLowerCase().replace("_", "")}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <Icon name="chevron_right" style={{ color: "var(--muted)" }} />
                    </div>
                  </div>
                );
              })}
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
            showToast(warning, "warning");
          } else {
            showToast("Support ticket created successfully.", "success");
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
    </div>
  );
}
