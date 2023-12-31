import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { UtilsService } from '../../services/utils.service';
import { Subscription } from 'rxjs';
import { Nutricionista, PacienteListado, PacienteNutri, PacienteXNutricionista } from 'src/app/models/usuario.model';
import { PlatosXPaciente, ReaccionesXPaciente } from 'src/app/models/plan.model';
import { MedicionPaciente, RegistroMedicion } from 'src/app/models/medicion.model';


@Component({
  selector: 'app-inicial-nutri',
  templateUrl: './inicial-nutri.page.html',
  styleUrls: ['./inicial-nutri.page.scss'],
})
export class InicialNutriPage implements OnInit {
  private subscription: Subscription;

  constructor(
    private router: Router,
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) { }
  correoNuevo: string = ''
  nombreNuevo: string = ''
  emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  pacientes: PacienteNutri[] = []
  pacientesListado: PacienteListado[] = []
  loading: boolean = false

  public results = [...this.pacientes];
  public ingreso = false;
  nombre: string = ""
  telefono: string = ""

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.ingreso = false;
    this.inicio()
  }

  async inicio() {
    this.utilSvc.presentLoading();
    this.loading = true;
    await this.obtenerPacientes()
    await this.obtenerNombreYTelefono()
    setTimeout(() => {
      this.utilSvc.dismissLoading()
      this.loading = false;
    }, 10)
    // await this.obtenerIndicadores()

  }

  async obtenerIndicadores() {
    this.pacientesListado = []
    for (let i = 0; i < this.pacientes.length; i++) {
      let registro: PacienteListado = {
        correo: this.pacientes[i].correo,
        nombre: this.pacientes[i].nombre,
        imc: "medium",
        tendencia: ""
      }
      let registros: RegistroMedicion[] = []
      await this.firebaseSvc.getRegistroOrdenado(this.pacientes[i].correo, 'Mediciones', 'registros').then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          let r = doc.data() as RegistroMedicion
          registros.push(r)
        })
        if (registros.length > 0) {
          registros.sort((a, b) => {
            const fechaA = new Date(a.fecha);
            const fechaB = new Date(b.fecha);
            return fechaA.getTime() - fechaB.getTime();
          });
          registros.reverse()
          let imc = registros[0].medicion.peso / (registros[0].medicion.talla / 100) ** 2
          if (imc < 18.5) {
            registro.imc = "secondary"
          } else if (imc < 25) {
            registro.imc = "success"
          } else {
            registro.imc = "warning"
          }
          if (registros.length == 2) {
            let imcAnterior = registros[1].medicion.peso / (registros[1].medicion.talla / 100) ** 2
            let indicadorAnterior = "success"
            if (imcAnterior < 18.5) {
              indicadorAnterior = "secondary"
            } else if (imcAnterior < 25) {
              indicadorAnterior = "success"
            } else {
              indicadorAnterior = "warning"
            }
            if (registro.imc == "secondary") {
              registros[0].medicion.peso > registros[1].medicion.peso ? registro.tendencia = "happy-outline" : registro.tendencia = "sad-outline"
            }
            if (registro.imc == "warning") {
              registros[0].medicion.peso < registros[1].medicion.peso ? registro.tendencia = "happy-outline" : registro.tendencia = "sad-outline"
            }
            if (registro.imc == "success" && indicadorAnterior !== "success") {
              registro.tendencia = "happy-outline"
            }
          }
        }
      })
      this.pacientesListado.push(registro)
    }
  }

  async obtenerNombreYTelefono() {
    (await this.firebaseSvc.getDocument('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'))).toPromise().then((res) => {
      let datos: Nutricionista = res.data() as Nutricionista
      this.nombre = datos.nombre
      this.telefono = datos.telefono
    })
  }

  async obtenerPacientes() {
    this.pacientes = [];
    (await (await this.firebaseSvc.getSubcollection2('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes')).toPromise()).forEach(async (doc) => {
      let data: PacienteNutri = doc.data() as PacienteNutri
      this.pacientes.push(data)
    });
    await this.ordenarPacientesPorNombre()
    await this.obtenerIndicadores()

    // this.subscription = (await this.firebaseSvc.getSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes')).subscribe(async (data) => {
    //   this.pacientes = []
    //   data.forEach((doc) => {
    //     let data: PacienteNutri = doc.payload.doc.data() as PacienteNutri
    //     this.pacientes.push(data)
    //   })
    //   await this.ordenarPacientesPorNombre()
    //   await this.obtenerIndicadores()
    // })
  }



  async ordenarPacientesPorNombre() {
    this.pacientes.sort((a, b) => {
      // Comparar los nombres en minúsculas para que sea insensible a mayúsculas/minúsculas
      const nombreA = a.nombre.toLowerCase();
      const nombreB = b.nombre.toLowerCase();

      if (nombreA < nombreB) {
        return -1;
      }
      if (nombreA > nombreB) {
        return 1;
      }
      return 0; // Los nombres son iguales
    });
  }

  handleInput(event) {
    if (event.target.value != null && event.target.value.length > 0) {
      this.ingreso = true;
      const query = event.target.value.toLowerCase();
      if (this.pacientes.filter((d: PacienteNutri) => d.nombre.toLowerCase().indexOf(query) > -1).length > 0) {
        this.results = this.pacientes.filter((d: PacienteNutri) => d.nombre.toLowerCase().indexOf(query) > -1);
      } else {
        let nulo: PacienteNutri[] = [{
          nombre: 'Sin coincidencias',
          correo: ''
        }]
        this.results = nulo
      }

    }
    else {
      this.ingreso = false
    }
  }



  agregarPaciente() {
    if (this.nombre == "" || this.telefono == "") {
      this.mensajeError("Debe completar su perfil para poder agregar pacientes")
    } else {
      Swal.fire({
        title: "Agregar paciente",
        html: '<input value="' + this.correoNuevo + '" id="swal-input1" class="swal2-input" placeholder= \'Correo\' style= "width:80%; margin:1em 0.7em 3px;">' +
          '<input type="text" value="' + this.nombreNuevo + '" id="swal-input2" class="swal2-input" placeholder= \'Nombre completo\' style= "width:80%; margin:1em 0.7em 3px;">',
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        heightAuto: false,
        preConfirm: () => {
          this.correoNuevo = (document.getElementById('swal-input1') as HTMLInputElement).value
          this.nombreNuevo = (document.getElementById('swal-input2') as HTMLInputElement).value
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (!this.emailRegex.test(this.correoNuevo)) {
            Swal.fire({
              icon: 'error',
              text: 'Ingrese un correo válido',
              heightAuto: false
            }).then(() => {
              this.agregarPaciente()
            })
          } else if (!this.correoNuevo || !this.nombreNuevo) {
            Swal.fire({
              icon: 'error',
              text: 'Debe completar todos los campos',
              heightAuto: false
            }).then(() => {
              this.agregarPaciente()
            })
          } else {
            this.agregarPacienteABase()
          }
        }
        if (result.isDismissed) {
          this.correoNuevo = ''
          this.nombreNuevo = ''
          Swal.close()
        }
      })
    }
  }

  async agregarPacienteABase() {
    this.utilSvc.presentLoading()
    this.loading = true;
    const valida = await this.validarCorreo(this.correoNuevo)
    if (valida) {
      await this.agregarABaseNutri()
      await this.agregarPacientesXNutri()
      this.inicio()
    } else {
      this.utilSvc.dismissLoading()
      this.loading = false;
      this.mensajeError('El paciente ya se encontraba en tu lista')
      this.correoNuevo = ''
      this.nombreNuevo = ''
    }
  }

  async agregarPacientesXNutri() {
    let referente: PacienteXNutricionista = {
      nombre: this.nombre,
      nutricionista: this.utilSvc.getElementInLocalStorage('correo'),
      perfilCompleto: false,
      paciente: ""
    }
    let uid = this.correoNuevo.toLowerCase();
    this.correoNuevo = '';
    this.nombreNuevo = '';
    (await this.firebaseSvc.getDocument('PacientesXNutricionista', uid)).toPromise().then(async (doc) => {
      let respuesta: PacienteXNutricionista = doc.data() as PacienteXNutricionista
      if (typeof respuesta == 'undefined') {
        let platos: PlatosXPaciente = {
          almuerzo: "",
          cena: "",
          recomendaciones: "",
          recetas: ""
        }
        let reacciones: ReaccionesXPaciente = {
          aguaBebida: "",
          caloriasIngeridas: "",
          caloriasQuemadas: "",
          fecha: ""
        }
        await this.firebaseSvc.setDocument('PlatosXPaciente', uid, platos)
        await this.firebaseSvc.setDocument('ReaccionesXPaciente', uid, reacciones)
        await this.firebaseSvc.setDocument('PacientesXNutricionista', uid, referente)
      } else {
        referente.perfilCompleto = respuesta.perfilCompleto
        referente.paciente = respuesta.paciente
        await this.firebaseSvc.updateDocument('PacientesXNutricionista', uid, referente)
      }

    })
  }

  async eliminarPacienteXNutri(uid: string) {
    let referente: PacienteXNutricionista = {
      nombre: "",
      nutricionista: "",
      perfilCompleto: false,
      paciente: ""
    };

    (await this.firebaseSvc.getDocument('PacientesXNutricionista', uid)).toPromise().then(async (doc) => {
      let respuesta: PacienteXNutricionista = doc.data() as PacienteXNutricionista
      if (typeof respuesta !== 'undefined') {
        referente.perfilCompleto = respuesta.perfilCompleto
        referente.paciente = respuesta.paciente
        await this.firebaseSvc.updateDocument('PacientesXNutricionista', uid, referente)
      }
    })
  }



  async validarCorreo(correo: string) {
    let id: string = ''
    await this.firebaseSvc.getDocInSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', 'correo', correo).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        id = doc.id
      }
      )
    });
    if (id !== '') {
      return false
    } else {
      return true
    }
  }

  async agregarABaseNutri() {
    let pac: PacienteNutri = {
      nombre: this.nombreNuevo,
      correo: this.correoNuevo.toLowerCase()
    }
    await this.firebaseSvc.addSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', pac).then(() => {
      this.utilSvc.dismissLoading()
      this.loading = false;
    })
  }


  mensajeError(mensaje: string) {
    Swal.fire({
      icon: 'error',
      text: mensaje,
      heightAuto: false
    })
  }

  editarOEliminarPaciente(paciente: PacienteNutri) {
    Swal.fire({
      title: paciente.nombre,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: "Editar",
      cancelButtonText: "Eliminar",
      heightAuto: false,
      reverseButtons: true,
      cancelButtonColor: '#DC143C'
    }).then((result) => {
      if (result.isConfirmed) {
        this.editarPaciente(paciente)
      } else if (result.dismiss.toString() == 'cancel') {
        this.eliminarPaciente(paciente)
      } else {
        Swal.close()
      }
    })
  }

  eliminarPaciente(paciente: PacienteNutri) {
    Swal.fire({
      title: "¿Desea eliminar al paciente?",
      text: paciente.nombre,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.utilSvc.presentLoading()
        this.loading = true;
        try {
          let id: string
          await this.firebaseSvc.getDocInSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', 'correo', paciente.correo).then((querySnapshot) => {
            querySnapshot.forEach(async (doc) => {
              id = doc.id
              let pac: PacienteNutri = doc.data() as PacienteNutri
              await this.eliminarPacienteXNutri(pac.correo)
            }
            )
          });
          await this.firebaseSvc.deleteDocSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', id).then(() => {
            this.utilSvc.dismissLoading();
            this.loading = false;
          })
          this.inicio()
        } catch (error) {
          this.utilSvc.dismissLoading()
          this.loading = false;
          this.mensajeError('Error al eliminar usuario')
        }
      } else {
        Swal.close()
      }
    })
  }

  editarPaciente(paciente: PacienteNutri) {
    let correo: string
    let nombre: string
    Swal.fire({
      title: paciente.nombre,
      html: '<input value="' + paciente.correo + '" id="swal-input1" class="swal2-input" placeholder= \'Correo\' style= "width:80%; margin:1em 0.7em 3px;">' +
        '<input type="text" value="' + paciente.nombre + '" id="swal-input2" class="swal2-input" placeholder= \'Nombre completo\' style= "width:80%; margin:1em 0.7em 3px;">',
      focusConfirm: false,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      heightAuto: false,
      preConfirm: () => {
        correo = (document.getElementById('swal-input1') as HTMLInputElement).value
        nombre = (document.getElementById('swal-input2') as HTMLInputElement).value
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (!this.emailRegex.test(correo)) {
          Swal.fire({
            icon: 'error',
            text: 'Ingrese un correo válido',
            heightAuto: false
          }).then(() => {
            this.editarPaciente(paciente)
          })
        } else if (!correo || !nombre) {
          Swal.fire({
            icon: 'error',
            text: 'Debe completar todos los campos',
            heightAuto: false
          }).then(() => {
            this.editarPaciente(paciente)
          })
        } else {
          let valida
          if (paciente.correo !== correo) {
            valida = await this.validarCorreo(correo)
          } else {
            valida = true
          }
          if (valida) {
            try {
              let id: string
              let registro: PacienteNutri = {
                nombre: nombre,
                correo: correo.toLowerCase()
              }
              await this.firebaseSvc.getDocInSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', 'correo', paciente.correo).then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  id = doc.id
                })
              });
              await this.firebaseSvc.updateSubcollection('Nutricionistas', this.utilSvc.getElementInLocalStorage('correo'), 'Pacientes', id, registro);
              let referente: PacienteXNutricionista = {
                nombre: "",
                nutricionista: "",
                perfilCompleto: false,
                paciente: ""
              };
              (await this.firebaseSvc.getDocument('PacientesXNutricionista', correo.toLowerCase())).toPromise().then(async (doc) => {
                let respuesta: PacienteXNutricionista = doc.data() as PacienteXNutricionista
                if (typeof respuesta !== 'undefined') {
                  referente = respuesta
                  referente.nutricionista = this.utilSvc.getElementInLocalStorage('correo')
                  referente.nombre = this.nombre
                  await this.firebaseSvc.updateDocument('PacientesXNutricionista', correo.toLowerCase(), referente)
                } else {
                  referente.nutricionista = this.utilSvc.getElementInLocalStorage('correo')
                  referente.nombre = this.nombre;
                  await this.firebaseSvc.setDocument('PacientesXNutricionista', correo.toLocaleLowerCase(), referente)
                }
              })
              this.inicio()
            } catch (error) {
              this.mensajeError('Error al editar paciente')
            }
          } else {
            this.mensajeError('No se pudo editar. El correo ya se encontraba en tu lista de pacientes')
          }
        }
      }
      if (result.isDismissed) {
        Swal.close()
      }

    })
  }

  verPaciente(paciente: PacienteNutri) {
    if (paciente.correo !== '') {
      this.utilSvc.setElementInLocalStorage('paciente-correo', paciente.correo)
      this.utilSvc.setElementInLocalStorage('paciente-nombre', paciente.nombre)
      this.router.navigate(['/tabs/opciones-paciente-nutri'])
    }
  }






}
