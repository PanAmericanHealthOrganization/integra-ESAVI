package com.ec.medrawhodrug.model;

import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/**
 *
 * @author Lucho
 */
@Entity
@Table(name = "datos_whodrug")
@NamedQueries({
    @NamedQuery(name = "DatosWhodrug.findAll", query = "SELECT d FROM DatosWhodrug d"),
    @NamedQuery(name = "DatosWhodrug.findAllAbbreviationByCode", query = "SELECT DISTINCT d.abbreviation as code,d.abbreviation FROM DatosWhodrug d WHERE d.abbreviation LIKE :abbreviation"),
    @NamedQuery(name = "DatosWhodrug.findAllAbbreviationByCodeCovid", query = "SELECT DISTINCT d.abbreviation as code,d.abbreviation FROM DatosWhodrug d WHERE d.abbreviation LIKE :abbreviation AND UPPER(d.abbreviation) LIKE 'COVID%'"),
    @NamedQuery(name = "DatosWhodrug.findAllAbbreviation", query = "SELECT DISTINCT d.abbreviation as code,d.abbreviation FROM DatosWhodrug d"),
    @NamedQuery(name = "DatosWhodrug.findDrugNameByAbbreviation", query = "SELECT DISTINCT d.drugCode,d.drugName,d.countrymedicinalProductID,d.medicinalProductID FROM DatosWhodrug d WHERE d.abbreviation = :abbreviation"),
    @NamedQuery(name = "DatosWhodrug.findMaholderByDrugCode", query = "SELECT DISTINCT d.maHoldersmedicinalProductID,d.maHolders FROM DatosWhodrug d WHERE d.drugCode = :drugCode"),
    @NamedQuery(name = "DatosWhodrug.findFormBymaHoldersmedicinalProductID", query = "SELECT DISTINCT d.formsmedicinalProductID,d.formTranslations FROM DatosWhodrug d WHERE d.maHoldersmedicinalProductID = :maHoldersmedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findStrengthByFormsmedicinalProductID", query = "SELECT DISTINCT d.strengthsmedicinalProductID,d.strength FROM DatosWhodrug d WHERE d.formsmedicinalProductID = :formsmedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findById", query = "SELECT d FROM DatosWhodrug d WHERE d.id = :id"),
    @NamedQuery(name = "DatosWhodrug.findByDrugCode", query = "SELECT d FROM DatosWhodrug d WHERE d.drugCode = :drugCode"),
    @NamedQuery(name = "DatosWhodrug.findByDrugName", query = "SELECT d FROM DatosWhodrug d WHERE d.drugName = :drugName"),
    @NamedQuery(name = "DatosWhodrug.findByMedicinalProductID", query = "SELECT d FROM DatosWhodrug d WHERE d.medicinalProductID = :medicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findByAtcs", query = "SELECT d FROM DatosWhodrug d WHERE d.atcs = :atcs"),
    @NamedQuery(name = "DatosWhodrug.findByAbbreviation", query = "SELECT d FROM DatosWhodrug d WHERE d.abbreviation = :abbreviation"),
    @NamedQuery(name = "DatosWhodrug.findByIngredient", query = "SELECT d FROM DatosWhodrug d WHERE d.ingredient = :ingredient"),
    @NamedQuery(name = "DatosWhodrug.findByIngredientTranslations", query = "SELECT d FROM DatosWhodrug d WHERE d.ingredientTranslations = :ingredientTranslations"),
    @NamedQuery(name = "DatosWhodrug.findByLanguageCode", query = "SELECT d FROM DatosWhodrug d WHERE d.languageCode = :languageCode"),
    @NamedQuery(name = "DatosWhodrug.findByIso3Code", query = "SELECT d FROM DatosWhodrug d WHERE d.iso3Code = :iso3Code"),
    @NamedQuery(name = "DatosWhodrug.findByCountrymedicinalProductID", query = "SELECT d FROM DatosWhodrug d WHERE d.countrymedicinalProductID = :countrymedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findByMaHolders", query = "SELECT d FROM DatosWhodrug d WHERE d.maHolders = :maHolders"),
    @NamedQuery(name = "DatosWhodrug.findByMaHoldersmedicinalProductID", query = "SELECT d FROM DatosWhodrug d WHERE d.maHoldersmedicinalProductID = :maHoldersmedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findByForm", query = "SELECT d FROM DatosWhodrug d WHERE d.form = :form"),
    @NamedQuery(name = "DatosWhodrug.findByFormTranslations", query = "SELECT d FROM DatosWhodrug d WHERE d.formTranslations = :formTranslations"),
    @NamedQuery(name = "DatosWhodrug.findByFormsmedicinalProductID", query = "SELECT d FROM DatosWhodrug d WHERE d.formsmedicinalProductID = :formsmedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findByStrength", query = "SELECT d FROM DatosWhodrug d WHERE d.strength = :strength"),
    @NamedQuery(name = "DatosWhodrug.findByStrengthsmedicinalProductID", query = "SELECT d FROM DatosWhodrug d WHERE d.strengthsmedicinalProductID = :strengthsmedicinalProductID"),
    @NamedQuery(name = "DatosWhodrug.findByIsGeneric", query = "SELECT d FROM DatosWhodrug d WHERE d.isGeneric = :isGeneric"),
    @NamedQuery(name = "DatosWhodrug.findByIsV", query = "SELECT d FROM DatosWhodrug d WHERE d.isV = :isV")})
public class DatosWhodrug implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "id", nullable = false)
    private Long id;
    @Column(name = "drugCode", length = 200)
    private String drugCode;
    @Column(name = "drugName", length = 500)
    private String drugName;
    @Column(name = "medicinalProductID", length = 100)
    private String medicinalProductID;
    @Column(name = "atcs", length = 50)
    private String atcs;
    @Column(name = "abbreviation", length = 100)
    private String abbreviation;
    @Column(name = "ingredient", length = 200)
    private String ingredient;
    @Column(name = "ingredientTranslations", length = 250)
    private String ingredientTranslations;
    @Column(name = "languageCode", length = 100)
    private String languageCode;
    @Column(name = "iso3Code", length = 100)
    private String iso3Code;
    @Column(name = "country_medicinalProductID", length = 150)
    private String countrymedicinalProductID;
    @Column(name = "maHolders", length = 100)
    private String maHolders;
    @Column(name = "maHolders_medicinalProductID", length = 150)
    private String maHoldersmedicinalProductID;
    @Column(name = "form", length = 500)
    private String form;
    @Column(name = "formTranslations", length = 500)
    private String formTranslations;
    @Column(name = "forms_medicinalProductID", length = 500)
    private String formsmedicinalProductID;
    @Column(name = "strength", length = 150)
    private String strength;
    @Column(name = "strengths_medicinalProductID", length = 500)
    private String strengthsmedicinalProductID;
    @Column(name = "isGeneric", length = 50)
    private String isGeneric;
    @Column(name = "isV", length = 50)
    private String isV;

    public DatosWhodrug() {
    }

    public DatosWhodrug(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDrugCode() {
        return drugCode;
    }

    public void setDrugCode(String drugCode) {
        this.drugCode = drugCode;
    }

    public String getDrugName() {
        return drugName;
    }

    public void setDrugName(String drugName) {
        this.drugName = drugName;
    }

    public String getMedicinalProductID() {
        return medicinalProductID;
    }

    public void setMedicinalProductID(String medicinalProductID) {
        this.medicinalProductID = medicinalProductID;
    }

    public String getAtcs() {
        return atcs;
    }

    public void setAtcs(String atcs) {
        this.atcs = atcs;
    }

    public String getAbbreviation() {
        return abbreviation;
    }

    public void setAbbreviation(String abbreviation) {
        this.abbreviation = abbreviation;
    }

    public String getIngredient() {
        return ingredient;
    }

    public void setIngredient(String ingredient) {
        this.ingredient = ingredient;
    }

    public String getIngredientTranslations() {
        return ingredientTranslations;
    }

    public void setIngredientTranslations(String ingredientTranslations) {
        this.ingredientTranslations = ingredientTranslations;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }

    public String getIso3Code() {
        return iso3Code;
    }

    public void setIso3Code(String iso3Code) {
        this.iso3Code = iso3Code;
    }

    public String getCountrymedicinalProductID() {
        return countrymedicinalProductID;
    }

    public void setCountrymedicinalProductID(String countrymedicinalProductID) {
        this.countrymedicinalProductID = countrymedicinalProductID;
    }

    public String getMaHolders() {
        return maHolders;
    }

    public void setMaHolders(String maHolders) {
        this.maHolders = maHolders;
    }

    public String getMaHoldersmedicinalProductID() {
        return maHoldersmedicinalProductID;
    }

    public void setMaHoldersmedicinalProductID(String maHoldersmedicinalProductID) {
        this.maHoldersmedicinalProductID = maHoldersmedicinalProductID;
    }

    public String getForm() {
        return form;
    }

    public void setForm(String form) {
        this.form = form;
    }

    public String getFormTranslations() {
        return formTranslations;
    }

    public void setFormTranslations(String formTranslations) {
        this.formTranslations = formTranslations;
    }

    public String getFormsmedicinalProductID() {
        return formsmedicinalProductID;
    }

    public void setFormsmedicinalProductID(String formsmedicinalProductID) {
        this.formsmedicinalProductID = formsmedicinalProductID;
    }

    public String getStrength() {
        return strength;
    }

    public void setStrength(String strength) {
        this.strength = strength;
    }

    public String getStrengthsmedicinalProductID() {
        return strengthsmedicinalProductID;
    }

    public void setStrengthsmedicinalProductID(String strengthsmedicinalProductID) {
        this.strengthsmedicinalProductID = strengthsmedicinalProductID;
    }

    public String getIsGeneric() {
        return isGeneric;
    }

    public void setIsGeneric(String isGeneric) {
        this.isGeneric = isGeneric;
    }

    public String getIsV() {
        return isV;
    }

    public void setIsV(String isV) {
        this.isV = isV;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof DatosWhodrug)) {
            return false;
        }
        DatosWhodrug other = (DatosWhodrug) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "model.medrawhodrug.com.ec.DatosWhodrug[ id=" + id + " ]";
    }
    
}
