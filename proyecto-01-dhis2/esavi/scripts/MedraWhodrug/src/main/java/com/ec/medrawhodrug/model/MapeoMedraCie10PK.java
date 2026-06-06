package com.ec.medrawhodrug.model;


import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Embeddable;

/**
 *
 * @author Lucho
 */
@Embeddable
public class MapeoMedraCie10PK implements Serializable {
	private static final long serialVersionUID = 1L;
    @Basic(optional = false)
    @Column(name = "CODIGO_CIE10", nullable = false, length = 50)
    private String codigoCie10;
    @Basic(optional = false)
    @Column(name = "CODIGO_LLT_MEDDRA", nullable = false, length = 50)
    private String codigoLltMeddra;

    public MapeoMedraCie10PK() {
    }

    public MapeoMedraCie10PK(String codigoCie10, String codigoLltMeddra) {
        this.codigoCie10 = codigoCie10;
        this.codigoLltMeddra = codigoLltMeddra;
    }

    public String getCodigoCie10() {
        return codigoCie10;
    }

    public void setCodigoCie10(String codigoCie10) {
        this.codigoCie10 = codigoCie10;
    }

    public String getCodigoLltMeddra() {
        return codigoLltMeddra;
    }

    public void setCodigoLltMeddra(String codigoLltMeddra) {
        this.codigoLltMeddra = codigoLltMeddra;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (codigoCie10 != null ? codigoCie10.hashCode() : 0);
        hash += (codigoLltMeddra != null ? codigoLltMeddra.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof MapeoMedraCie10PK)) {
            return false;
        }
        MapeoMedraCie10PK other = (MapeoMedraCie10PK) object;
        if ((this.codigoCie10 == null && other.codigoCie10 != null) || (this.codigoCie10 != null && !this.codigoCie10.equals(other.codigoCie10))) {
            return false;
        }
        if ((this.codigoLltMeddra == null && other.codigoLltMeddra != null) || (this.codigoLltMeddra != null && !this.codigoLltMeddra.equals(other.codigoLltMeddra))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "model.medrawhodrug.com.ec.MapeoMedraCie10PK[ codigoCie10=" + codigoCie10 + ", codigoLltMeddra=" + codigoLltMeddra + " ]";
    }
    
}
