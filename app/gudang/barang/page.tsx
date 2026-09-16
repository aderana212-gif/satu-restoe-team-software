export default function MasterBarangPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "24px",
        color: "#243047",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <a
          href="/gudang"
          style={{
            color: "#287f78",
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          ← Kembali ke Gudang & Inventaris
        </a>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px",
            marginTop: "20px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color: "#287f78",
                  fontSize: "32px",
                  fontWeight: 700,
                }}
              >
                Master Barang
              </h1>

              <p
                style={{
                  color: "#687386",
                  fontSize: "16px",
                  marginTop: "10px",
                }}
              >
                Kelola daftar bahan baku, minuman, kemasan, perlengkapan,
                dan aset Satu Restoe.
              </p>
            </div>

            <button
              style={{
                background: "#287f78",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "13px 20px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Tambah Barang
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginTop: "28px",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e9ef",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ color: "#687386", fontSize: "14px" }}>
                Total Barang
              </div>
              <strong
                style={{
                  display: "block",
                  color: "#287f78",
                  fontSize: "28px",
                  marginTop: "8px",
                }}
              >
                0
              </strong>
            </div>

            <div
              style={{
                border: "1px solid #e5e9ef",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ color: "#687386", fontSize: "14px" }}>
                Barang Aktif
              </div>
              <strong
                style={{
                  display: "block",
                  color: "#287f78",
                  fontSize: "28px",
                  marginTop: "8px",
                }}
              >
                0
              </strong>
            </div>

            <div
              style={{
                border: "1px solid #e5e9ef",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ color: "#687386", fontSize: "14px" }}>
                Stok Menipis
              </div>
              <strong
                style={{
                  display: "block",
                  color: "#d98216",
                  fontSize: "28px",
                  marginTop: "8px",
                }}
              >
                0
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: "30px",
              border: "1px solid #e5e9ef",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px",
                background: "#f8fafc",
                fontWeight: 700,
                color: "#243047",
              }}
            >
              Daftar Barang
            </div>

            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#687386",
              }}
            >
              Belum ada data barang.
              <br />
              Tambahkan barang pertama untuk mulai mengelola stok.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
