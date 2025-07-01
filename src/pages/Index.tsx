import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Trash2, FileText, Building, User, Settings, Shield, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Prestation {
  typedeprestation: string;
  quantite: {
    valeur: number;
    unite: string;
  };
  prixunitaire: number;
  tauxtva: number;
}

interface DevisData {
  // Méta devis
  numeroDevis: string;
  dateDevis: string;
  devise: string;
  
  // Artisan/Entreprise
  artisanNom: string;
  artisanAdresse: string;
  artisanTel: string;
  artisanEmail: string;
  
  // Informations légales entreprise
  siret: string;
  codeApe: string;
  rcs: string;
  formeJuridique: string;
  capitalSocial: string;
  tvaIntracommunautaire: string;
  
  // Client
  clientNom: string;
  clientAdresse: string;
  
  // Informations contractuelles
  conditionsPaiement: string;
  delaisExecution: string;
  lieuExecution: string;
  assuranceProfessionnelle: string;
  
  // Assurance décennale (pour plombiers)
  assuranceDecennale: string;
  numeroPoliceDecennale: string;
  zoneGeographique: string;
  
  // Mentions obligatoires
  cgv: string;
  validiteDevis: string;
  penalitesRetard: string;
  prestations: Prestation[];
}

const Index = () => {
  const [data, setData] = useState<DevisData>({
    numeroDevis: "D-MAN-250622-002",
    dateDevis: new Date().toISOString().split("T")[0],
    devise: "EUR",
    artisanNom: "Entreprise ABC",
    artisanAdresse: "12 rue des Lilas, 75000 Paris",
    artisanTel: "06 00 00 00 00",
    artisanEmail: "contact@abc.fr",
    siret: "12345678901234",
    codeApe: "4334Z",
    rcs: "RCS Paris 123 456 789",
    formeJuridique: "SARL",
    capitalSocial: "10 000",
    tvaIntracommunautaire: "FR12345678901",
    clientNom: "Jean Dupont",
    clientAdresse: "23 Rue Richelieu, Paris",
    conditionsPaiement: "30% à la commande, 70% à la livraison",
    delaisExecution: "15 jours ouvrés",
    lieuExecution: "Domicile du client",
    assuranceProfessionnelle: "Allianz - Police n°ABC123456 - Territoire français",
    assuranceDecennale: "Groupama - Police n°DEF789012",
    numeroPoliceDecennale: "DEF789012",
    zoneGeographique: "Île-de-France",
    cgv: "Nos conditions générales de vente sont disponibles sur demande",
    validiteDevis: "30 jours",
    penalitesRetard: "En cas de retard de paiement, une pénalité de 10 % du montant TTC",
    prestations: [
      {
        typedeprestation: "Réparation mur en pierre",
        quantite: { valeur: 30, unite: "m2" },
        prixunitaire: 45,
        tauxtva: 20
      },
      {
        typedeprestation: "Réparation plafond",
        quantite: { valeur: 12, unite: "m" },
        prixunitaire: 15,
        tauxtva: 20
      }
    ]
  });

  const [remise, setRemise] = useState(0);
  const [applyRemise, setApplyRemise] = useState(true);

  const updateData = (field: keyof DevisData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updatePrestation = (index: number, field: keyof Prestation, value: any) => {
    const newPrestations = [...data.prestations];
    if (field === 'quantite') {
      newPrestations[index].quantite = { ...newPrestations[index].quantite, ...value };
    } else {
      newPrestations[index] = { ...newPrestations[index], [field]: value };
    }
    setData(prev => ({ ...prev, prestations: newPrestations }));
  };

  const ajouterLigne = () => {
    setData(prev => ({
      ...prev,
      prestations: [...prev.prestations, {
        typedeprestation: '',
        quantite: { valeur: 0, unite: '' },
        prixunitaire: 0,
        tauxtva: 20
      }]
    }));
  };

  const supprimerLigne = (index: number) => {
    setData(prev => ({
      ...prev,
      prestations: prev.prestations.filter((_, i) => i !== index)
    }));
  };

  const calculerTotaux = () => {
    let totalHT = 0;
    let totalTVA = 0;
    
    data.prestations.forEach(p => {
      const ht = p.prixunitaire * p.quantite.valeur;
      const tva = ht * (p.tauxtva / 100);
      totalHT += ht;
      totalTVA += tva;
    });
    
    const remiseAppliquee = applyRemise ? remise : 0;
    const sousTotal = totalHT - remiseAppliquee;
    const totalTTC = sousTotal + totalTVA;
    
    return { totalHT, totalTVA, remise: remiseAppliquee, sousTotal, totalTTC };
  };

  function ajouterFooter(doc, pageNumber, totalPages) {
    const grisFoncé = "#1e293b";
    doc.setFillColor(grisFoncé);
    doc.setTextColor("#94a3b8");
    doc.setFontSize(8);
    doc.rect(0, 287, 210, 10, "F");

    // Ligne 1 : infos légales
    const footerLine1 = `(${data.formeJuridique}) - SIRET: ${data.siret} - RCS/RM: ${data.rcs}`;
    doc.text(footerLine1, 105, 291, { align: "center" });

    // Ligne 2 : APE, Capital, TVA
    const footerLine2 = `APE: ${data.codeApe} - Capital: ${data.capitalSocial}€ - TVA: ${data.tvaIntracommunautaire}`;
    doc.text(footerLine2, 105, 295, { align: "center" });

    // Pagination : alignée proprement à droite, même ligne que Line 2
    doc.text(`Page ${pageNumber} / ${totalPages}`, 195, 293, { align: "right" });
  }
  
  const genererPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const totaux = calculerTotaux();
    const today = new Date().toLocaleDateString("fr-FR");

    // Couleurs
    const violet = "#6366f1";
    const grisClair = "#f8fafc";
    const grisFoncé = "#1e293b";
    const grisTexte = "#475569";

    // ---------- HEADER ----------
    doc.setFillColor(violet);
    doc.rect(0, 0, 210, 30, "F"); // Bandeau haut
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("DEVIS", 14, 15);
    doc.setFontSize(12);
    doc.text(data.artisanNom, 14, 19);

    doc.setFontSize(10);
    doc.text(`N° ${data.numeroDevis}`, 150, 15);
    doc.text(`Date : ${data.dateDevis}`, 150, 19);

    // ---------- ENTREPRISE & CLIENT ----------
    doc.setTextColor(grisFoncé);
    doc.setFontSize(12);
    doc.text("Entreprise", 14, 40);
    doc.text("Client", 110, 40);

    doc.setFontSize(10);
    doc.setTextColor(grisTexte);
    doc.text(`${data.artisanNom}`, 14, 46);
    doc.text(`${data.artisanAdresse}`, 14, 51);
    doc.text(`${data.artisanTel}`, 14, 56);
    doc.text(`${data.artisanEmail}`, 14, 61);
    /*doc.text(`SIRET: ${data.siret}`, 14, 66);
    doc.text(`TVA: ${data.tvaIntracommunautaire}`, 14, 71);*/

    doc.text(`${data.clientNom}`, 110, 46);
    doc.text(`${data.clientAdresse}`, 110, 51);

    // ---------- VALIDITÉ ----------
    doc.setFillColor("#fef3c7");
    doc.setDrawColor("#f59e0b");
    doc.roundedRect(14, 66, 182, 10, 2, 2, "FD");
    doc.setTextColor("#92400e");
    doc.setFontSize(10);
    doc.text(`Ce devis est valable ${data.validiteDevis} à compter de sa date d'émission ${today}`, 20, 73);

    // ---------- TABLEAU DES PRESTATIONS ----------
    const tableData = data.prestations.map((p) => {
      const qte = `${p.quantite.valeur} ${p.quantite.unite}`;
      const ht = p.prixunitaire * p.quantite.valeur;
      const ttc = ht * (1 + p.tauxtva / 100);
      return [
        p.typedeprestation,
        qte,
        `${p.prixunitaire.toFixed(2)} €`,
        `${p.tauxtva.toFixed(0)} %`,
        `${ht.toFixed(2)} €`,
        `${ttc.toFixed(2)} €`,
      ];
    });

    doc.setTextColor(grisFoncé);
    doc.setFontSize(12);
    doc.text("Prestations", 14, 85);

    autoTable(doc, {
      startY: 87,
      head: [["Description", "Qté", "PU HT", "TVA (%)", "Total HT", "Total TTC"]],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
      },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    let y = (doc as any).lastAutoTable.finalY + 2;
    // Si la table finit trop bas, on ajoute une page
    if (y > 230) {
      doc.addPage();
      y = 20; // nouvelle position de départ en haut de la page suivante
    }


    // ---------- TOTAUX ----------
    doc.setFillColor(grisClair);
    doc.roundedRect(14, y, 182, 30, 2, 2, "F");
    doc.setTextColor(grisTexte);
    doc.setFontSize(10);
    let line = y + 7;
    doc.text(`Sous-total HT : ${totaux.totalHT.toFixed(2)} €`, 20, line);
    line += 6;
    if (totaux.remise > 0) {
      doc.setTextColor("#dc2626");
      doc.text(`Remise : -${totaux.remise.toFixed(2)} €`, 20, line);
      line += 6;
    }
    doc.setTextColor(grisTexte);
    doc.text(`TVA : ${totaux.totalTVA.toFixed(2)} €`, 20, line);
    line += 8;
    doc.setTextColor(violet);
    doc.setFontSize(12);
    doc.text(`TOTAL TTC : ${totaux.totalTTC.toFixed(2)} €`, 20, line);

    // ---------- CONDITIONS ----------
    let y2 = line + 15;
    if (y2 + 70 > 287) { // 70 = espace estimé requis pour conditions + signatures
      doc.addPage();
      y2 = 20; // recommence en haut de nouvelle page
    }
    doc.setTextColor(grisFoncé);
    doc.setFontSize(11);
    doc.text("Conditions & Assurances", 14, y2);

    doc.setFontSize(9);
    doc.setTextColor(grisTexte);
    const conditions = [
      `• Acompte : ${data.conditionsPaiement}`,
      `• Délais : ${data.delaisExecution}`,
      `• Lieu : ${data.lieuExecution}`,
      `• Pénalités de retard : ${data.penalitesRetard}`,
      `• Assurance pro : ${data.assuranceProfessionnelle}`,
      `• Assurance décennale : ${data.assuranceDecennale} (${data.numeroPoliceDecennale})`,
    ];

    let cy = y2 + 6;
    conditions.forEach((c) => {
      doc.text(c, 14, cy);
      cy += 5;
    });

    // ---------- SIGNATURE ----------
    doc.setDrawColor("#cbd5e1");
    doc.setLineWidth(0.4);
    (doc as any).setLineDash([2], 0);
    doc.rect(14, cy + 4, 85, 40);
    doc.rect(111, cy + 4, 85, 40);
    (doc as any).setLineDash([]);

    doc.setFontSize(10);
    doc.setTextColor(violet);
    doc.text("Signature Client", 45, cy + 10);
    doc.text("Signature Entreprise", 132, cy + 10);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      ajouterFooter(doc, i, totalPages);
    }


    // ---------- ENREGISTREMENT ----------
    doc.save(`devis-${data.numeroDevis}.pdf`);
  };

  const simulerDonneesOpenAI = () => {
    const donneesTest = {
      ...data,
      clientNom: "Marie Martin",
      prestations: [
        {
          typedeprestation: "Pose de carrelage",
          quantite: { valeur: 25, unite: "m²" },
          prixunitaire: 45,
          tauxtva: 20
        },
        {
          typedeprestation: "Installation sanitaire",
          quantite: { valeur: 1, unite: "ensemble" },
          prixunitaire: 800,
          tauxtva: 20
        }
      ]
    };
    setData(donneesTest);
  };

  const totaux = calculerTotaux();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ✨ Éditeur de Devis Professionnel
          </h1>
          <p className="text-gray-600 text-lg">Créez des devis conformes et professionnels en quelques clics</p>
        </div>

        <Tabs defaultValue="informations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="informations" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Devis
            </TabsTrigger>
            <TabsTrigger value="entreprise" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Légal
            </TabsTrigger>
            <TabsTrigger value="contractuel" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Contractuel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations du devis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="numeroDevis">Numéro du devis</Label>
                    <Input
                      id="numeroDevis"
                      value={data.numeroDevis}
                      onChange={(e) => updateData('numeroDevis', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateDevis">Date</Label>
                    <Input
                      id="dateDevis"
                      type="date"
                      value={data.dateDevis}
                      onChange={(e) => updateData('dateDevis', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="devise">Devise</Label>
                    <Select value={data.devise} onValueChange={(value) => updateData('devise', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prestations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Prestations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestation</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Unité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>TVA (%)</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead>Total TTC</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.prestations.map((prestation, index) => {
                        const totalHT = prestation.prixunitaire * prestation.quantite.valeur;
                        const totalTTC = totalHT * (1 + prestation.tauxtva / 100);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={prestation.typedeprestation}
                                onChange={(e) => updatePrestation(index, 'typedeprestation', e.target.value)}
                                placeholder="Description de la prestation"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={prestation.quantite.valeur}
                                onChange={(e) => updatePrestation(index, 'quantite', { valeur: Number(e.target.value) })}
                                min="0"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={prestation.quantite.unite}
                                onChange={(e) => updatePrestation(index, 'quantite', { unite: e.target.value })}
                                placeholder="m², h, u..."
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={prestation.prixunitaire}
                                onChange={(e) => updatePrestation(index, 'prixunitaire', Number(e.target.value))}
                                min="0"
                                step="0.01"
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={prestation.tauxtva}
                                onChange={(e) => updatePrestation(index, 'tauxtva', Number(e.target.value))}
                                min="0"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {totalHT.toFixed(2)} €
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {totalTTC.toFixed(2)} €
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => supprimerLigne(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4">
                  <Button onClick={ajouterLigne} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter une ligne
                  </Button>
                </div>

                {/* Remise */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="remise">Remise globale (€)</Label>
                      <Input
                        id="remise"
                        type="number"
                        value={remise}
                        onChange={(e) => setRemise(Number(e.target.value))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="applyRemise"
                        checked={applyRemise}
                        onCheckedChange={(checked) => setApplyRemise(checked === true)}
                      />
                      <Label htmlFor="applyRemise">Appliquer la remise</Label>
                    </div>
                  </div>
                </div>

                {/* Totaux */}
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total HT :</span>
                      <span className="font-semibold">{totaux.totalHT.toFixed(2)} €</span>
                    </div>
                    {totaux.remise > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Remise :</span>
                        <span className="font-semibold">-{totaux.remise.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Sous-total :</span>
                      <span className="font-semibold">{totaux.sousTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA :</span>
                      <span className="font-semibold">{totaux.totalTVA.toFixed(2)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>TOTAL TTC :</span>
                      <span>{totaux.totalTTC.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entreprise" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations de l'entreprise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="artisanNom">Nom / Raison sociale</Label>
                    <Input
                      id="artisanNom"
                      value={data.artisanNom}
                      onChange={(e) => updateData('artisanNom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="artisanAdresse">Adresse complète</Label>
                    <Input
                      id="artisanAdresse"
                      value={data.artisanAdresse}
                      onChange={(e) => updateData('artisanAdresse', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="artisanTel">Téléphone</Label>
                    <Input
                      id="artisanTel"
                      value={data.artisanTel}
                      onChange={(e) => updateData('artisanTel', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="artisanEmail">E-mail</Label>
                    <Input
                      id="artisanEmail"
                      type="email"
                      value={data.artisanEmail}
                      onChange={(e) => updateData('artisanEmail', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientNom">Nom complet</Label>
                    <Input
                      id="clientNom"
                      value={data.clientNom}
                      onChange={(e) => updateData('clientNom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAdresse">Adresse</Label>
                    <Input
                      id="clientAdresse"
                      value={data.clientAdresse}
                      onChange={(e) => updateData('clientAdresse', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Mentions légales obligatoires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant="destructive" className="mb-4">🚨 Informations obligatoires</Badge>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siret">SIRET <span className="text-red-500">*</span></Label>
                      <Input
                        id="siret"
                        value={data.siret}
                        onChange={(e) => updateData('siret', e.target.value)}
                        placeholder="Ex: 12345678901234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="codeApe">Code APE/NAF <span className="text-red-500">*</span></Label>
                      <Input
                        id="codeApe"
                        value={data.codeApe}
                        onChange={(e) => updateData('codeApe', e.target.value)}
                        placeholder="Ex: 4334Z"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rcs">RCS/RM + ville <span className="text-red-500">*</span></Label>
                      <Input
                        id="rcs"
                        value={data.rcs}
                        onChange={(e) => updateData('rcs', e.target.value)}
                        placeholder="Ex: RCS Paris 123 456 789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="formeJuridique">Forme juridique <span className="text-red-500">*</span></Label>
                      <Select value={data.formeJuridique} onValueChange={(value) => updateData('formeJuridique', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SARL">SARL</SelectItem>
                          <SelectItem value="EURL">EURL</SelectItem>
                          <SelectItem value="SAS">SAS</SelectItem>
                          <SelectItem value="SASU">SASU</SelectItem>
                          <SelectItem value="Auto-entrepreneur">Auto-entrepreneur</SelectItem>
                          <SelectItem value="Artisan">Artisan</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="capitalSocial">Capital social (€)</Label>
                      <Input
                        id="capitalSocial"
                        value={data.capitalSocial}
                        onChange={(e) => updateData('capitalSocial', e.target.value)}
                        placeholder="Ex: 10 000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tvaIntracommunautaire">N° TVA intracommunautaire</Label>
                      <Input
                        id="tvaIntracommunautaire"
                        value={data.tvaIntracommunautaire}
                        onChange={(e) => updateData('tvaIntracommunautaire', e.target.value)}
                        placeholder="Ex: FR12345678901"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔧 Assurances professionnelles (Plombier)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assuranceDecennale">Assurance décennale</Label>
                    <Input
                      id="assuranceDecennale"
                      value={data.assuranceDecennale}
                      onChange={(e) => updateData('assuranceDecennale', e.target.value)}
                      placeholder="Ex: Groupama - Police n°DEF789012"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroPoliceDecennale">Numéro de police décennale</Label>
                      <Input
                        id="numeroPoliceDecennale"
                        value={data.numeroPoliceDecennale}
                        onChange={(e) => updateData('numeroPoliceDecennale', e.target.value)}
                        placeholder="Ex: DEF789012"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zoneGeographique">Zone géographique couverte</Label>
                      <Input
                        id="zoneGeographique"
                        value={data.zoneGeographique}
                        onChange={(e) => updateData('zoneGeographique', e.target.value)}
                        placeholder="Ex: Île-de-France"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractuel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Informations contractuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge className="mb-4">📝 Conditions obligatoires</Badge>
                  
                  <div>
                    <Label htmlFor="conditionsPaiement">Conditions de paiement <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="conditionsPaiement"
                      value={data.conditionsPaiement}
                      onChange={(e) => updateData('conditionsPaiement', e.target.value)}
                      placeholder="Ex: 30% à la commande, 70% à la livraison"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="delaisExecution">Délais d'exécution <span className="text-red-500">*</span></Label>
                      <Input
                        id="delaisExecution"
                        value={data.delaisExecution}
                        onChange={(e) => updateData('delaisExecution', e.target.value)}
                        placeholder="Ex: 15 jours ouvrés"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lieuExecution">Lieu d'exécution <span className="text-red-500">*</span></Label>
                      <Input
                        id="lieuExecution"
                        value={data.lieuExecution}
                        onChange={(e) => updateData('lieuExecution', e.target.value)}
                        placeholder="Ex: Domicile du client"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="assuranceProfessionnelle">Assurance professionnelle <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="assuranceProfessionnelle"
                      value={data.assuranceProfessionnelle}
                      onChange={(e) => updateData('assuranceProfessionnelle', e.target.value)}
                      placeholder="Ex: Allianz - Police n°ABC123456 - Territoire français"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="validiteDevis">Validité du devis</Label>
                      <Input
                        id="validiteDevis"
                        value={data.validiteDevis}
                        onChange={(e) => updateData('validiteDevis', e.target.value)}
                        placeholder="Ex: 30 jours"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="penalitesRetard">Pénalités de retard</Label>
                    <Textarea
                      id="penalitesRetard"
                      value={data.penalitesRetard}
                      onChange={(e) => updateData('penalitesRetard', e.target.value)}
                      placeholder="Ex: 10% du montant TTC par mois de retard entamé, sans mise en demeure préalable"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cgv">Conditions générales de vente</Label>
                    <Textarea
                      id="cgv"
                      value={data.cgv}
                      onChange={(e) => updateData('cgv', e.target.value)}
                      placeholder="Ex: Nos conditions générales de vente sont disponibles sur demande"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>✍️ Mentions client obligatoires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Mentions automatiques incluses dans le PDF :</h4>
                    <ul className="text-sm space-y-1">
                      <li>• "Devis reçu avant exécution des travaux"</li>
                      <li>• Espace signature client + date</li>
                      <li>• Référence aux conditions générales de vente</li>
                      <li>• Validité du devis ({data.validiteDevis})</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={simulerDonneesOpenAI} variant="outline" className="flex items-center gap-2">
            🤖 Simuler données OpenAI
          </Button>
          <Button onClick={genererPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Télécharger le PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
