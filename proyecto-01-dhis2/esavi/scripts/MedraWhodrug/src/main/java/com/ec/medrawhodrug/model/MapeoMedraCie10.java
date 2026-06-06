package com.ec.medrawhodrug.model;


import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/**
 *
 * @author Lucho
 */
@Entity
@Table(name = "mapeo_medra_cie10")
@NamedQueries({
    @NamedQuery(name = "MapeoMedraCie10.findAll", query = "SELECT m FROM MapeoMedraCie10 m"),
    @NamedQuery(name = "MapeoMedraCie10.findByCodigoCie10", query = "SELECT m FROM MapeoMedraCie10 m WHERE m.mapeoMedraCie10PK.codigoCie10 = :codigoCie10"),
    @NamedQuery(name = "MapeoMedraCie10.findByTerminoCie10", query = "SELECT m FROM MapeoMedraCie10 m WHERE m.terminoCie10 = :terminoCie10"),
    @NamedQuery(name = "MapeoMedraCie10.findByCodigoLltMeddra", query = "SELECT m FROM MapeoMedraCie10 m WHERE m.mapeoMedraCie10PK.codigoLltMeddra = :codigoLltMeddra ORDER BY m.mapeoMedraCie10PK.codigoLltMeddra DESC")})
public class MapeoMedraCie10 implements Serializable {

    private static final long serialVersionUID = 1L;
    @EmbeddedId
    protected MapeoMedraCie10PK mapeoMedraCie10PK;
    @Column(name = "TERMINO_CIE_10", length = 1000)
    private String terminoCie10;

    public MapeoMedraCie10() {
    }

    public MapeoMedraCie10(MapeoMedraCie10PK mapeoMedraCie10PK) {
        this.mapeoMedraCie10PK = mapeoMedraCie10PK;
    }

    public MapeoMedraCie10(String codigoCie10, String códigoLltMeddra) {
        this.mapeoMedraCie10PK = new MapeoMedraCie10PK(codigoCie10, códigoLltMeddra);
    }

    public MapeoMedraCie10PK getMapeoMedraCie10PK() {
        return mapeoMedraCie10PK;
    }

    public void setMapeoMedraCie10PK(MapeoMedraCie10PK mapeoMedraCie10PK) {
        this.mapeoMedraCie10PK = mapeoMedraCie10PK;
    }

    public String getTerminoCie10() {
        return terminoCie10;
    }

    public void setTerminoCie10(String terminoCie10) {
        this.terminoCie10 = terminoCie10;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (mapeoMedraCie10PK != null ? mapeoMedraCie10PK.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof MapeoMedraCie10)) {
            return false;
        }
        MapeoMedraCie10 other = (MapeoMedraCie10) object;
        if ((this.mapeoMedraCie10PK == null && other.mapeoMedraCie10PK != null) || (this.mapeoMedraCie10PK != null && !this.mapeoMedraCie10PK.equals(other.mapeoMedraCie10PK))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "model.medrawhodrug.com.ec.MapeoMedraCie10[ mapeoMedraCie10PK=" + mapeoMedraCie10PK + " ]";
    }
    
}
