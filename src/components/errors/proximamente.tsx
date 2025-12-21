import React from "react";

const Proximamente: React.FC = () => {
	return (
		<div style={{
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			height: "60vh",
			textAlign: "center",
			color: "#555"
		}}>
			<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="12" cy="12" r="10" stroke="#1976d2" strokeWidth="2" fill="#e3f2fd" />
				<path d="M8 12h8M12 8v8" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" />
			</svg>
			<h1 style={{ margin: "24px 0 8px 0", color: "#1976d2" }}>¡En desarrollo!</h1>
			<p>Esta funcionalidad estará disponible próximamente.<br />Por favor, vuelve más tarde.</p>
		</div>
	);
};

export default Proximamente;
