import { Component, OnInit} from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';




@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{

  showPassword = false;
  passwordToggleIcon = 'eye-off';
  modelLogin = {
    user: '',
    contrasena: ''
  };
  emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
 correo: string = ''
 pass: string = ''
 nutri: string = ''
 fotoTitulo: any = '';


  constructor(private router: Router) {}

    ngOnInit(){
      this.modelLogin.user = ''
      this.modelLogin.contrasena = ''
      this.correo=''
      this.pass=''
      this.nutri=''
    }

    ionViewWillEnter(){
      this.modelLogin.user = ''
      this.modelLogin.contrasena = ''
    }

    iniciar(){
      console.log("Nombre de usuario: " + this.modelLogin.user)
      console.log("Contraseña: " + this.modelLogin.contrasena)
      if(!this.emailRegex.test(this.modelLogin.user)){
        this.mensajeError('Ingrese un correo válido')
      } else if(!this.modelLogin.user || !this.modelLogin.contrasena){
        this.mensajeError('Debe completar todos los datos')
      }
      else{
        this.router.navigate(['/tabs/inicial'])
      }

    }

    async recordar(){
      	
const { value: email } = await Swal.fire({
  title: 'Ingrese su correo',
  input: 'email',
  inputPlaceholder: 'correo@nutricoach.com',
  showCancelButton: true,
  confirmButtonText: "Aceptar",
  cancelButtonText: "Cancelar",
  reverseButtons: true,
  heightAuto: false,
  inputValidator: (value) =>{
    return new Promise((resolve) => {
      if(!value){
        resolve('Correo no válido')
      }
      else if(value && !this.emailRegex.test(value)){
        resolve('Correo no válido')
      }
      else{
        console.log("Se ingreso: " + value);
        this.enviarCorreo(value)
        //Swal.close()
      }
      })
    }
  }
)
    }

    enviarCorreo(value:string){
      //COMPLETAR EL ENVIO DE CORREO
      this.notificarCorreo()

    }

    notificarCorreo(){
      Swal.fire({
        icon:'success',
        title: 'Correo enviado',
        text: 'Verifique su bandeja de entrada',
        heightAuto: false
      })
    }

    changePassword(): void {
      this.showPassword = !this.showPassword;
      if (this.passwordToggleIcon === 'eye') { this.passwordToggleIcon = 'eye-off'; } else { this.passwordToggleIcon = 'eye'; }
    }

    registrar(){
      Swal.fire({
        showCancelButton: true,
        confirmButtonText: "Soy Nutricionista",
        cancelButtonText: "Soy Paciente",
        heightAuto: false,
      }).then((result)=>{
        if(result.isConfirmed){
          this.registrarNutri()
        }
        if(result.isDismissed){
          this.registrarPaciente()
        }
      })

    }

    registrarPaciente(){
      Swal.fire({
        title: 'Complete sus datos',
        heightAuto: false,
        html:
          '<input value="'+this.correo+'" id="swal-input1" class="swal2-input" placeholder= \'Correo\' style= "width:80%; margin:1em 0.7em 3px;">' +
          '<input type="password" value="'+this.pass+'" id="swal-input2" class="swal2-input" placeholder= \'Contraseña\' style= "width:80%; margin:1em 0.7em 3px;">',
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            this.correo = (document.getElementById('swal-input1') as HTMLInputElement).value
            this.pass =  (document.getElementById('swal-input2') as HTMLInputElement).value
                  }
      }).then((result) => {
        if(result.isConfirmed){
          if(!this.emailRegex.test(this.correo)){
            Swal.fire({
             icon:'error',
             text: 'Ingrese un correo válido',
             heightAuto: false
            }).then(() => {
             this.registrarPaciente()
            }
            )
           } else if( !this.correo || !this.pass){
             Swal.fire({
               icon:'error',
               text: 'Debe completar todos los campos',
               heightAuto: false
              }).then(() => {
               this.registrarPaciente()
              }
              )
           } else{
            //ACA SE DEBE REGISTRAR AL USUARIO
            this.correo=''
            this.pass=''
            this.notificarCorreo()
           }
        }
        if(result.isDismissed){
          this.correo=''
          this.pass=''
          Swal.close()
        }
      })
    }



    registrarNutri(){
     Swal.fire({
        title: 'Complete sus datos',
        heightAuto: false,
        html:
          '<input value="'+this.correo+'" id="swal-input1" class="swal2-input" placeholder= \'Correo\' style= "width:80%; margin:1em 0.7em 3px;">' +
          '<input type="password" value="'+this.pass+'" id="swal-input2" class="swal2-input" placeholder= \'Contraseña\' style= "width:80%; margin:1em 0.7em 3px;">' +
          '<input type="text" value="'+this.nutri+'" id="swal-input3" class="swal2-input" placeholder= \'Matrícula\' style= "width:80%; margin:1em 0.7em 3px;">',
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            this.correo = (document.getElementById('swal-input1') as HTMLInputElement).value
            this.pass =  (document.getElementById('swal-input2') as HTMLInputElement).value
            this.nutri = (document.getElementById('swal-input3') as HTMLInputElement).value
                  }
      }).then((result) => {
        if(result.isConfirmed){
          if(!this.emailRegex.test(this.correo)){
            Swal.fire({
             icon:'error',
             text: 'Ingrese un correo válido',
             heightAuto: false
            }).then(() => {
             this.registrarNutri()
            }
            )
           } else if( !this.correo || !this.pass || !this.nutri){
             Swal.fire({
               icon:'error',
               text: 'Debe completar todos los campos',
               heightAuto: false
              }).then(() => {
               this.registrarNutri()
              }
              )
           } else{
            //ACA SE DEBE REGISTRAR AL USUARIO
            this.registrarNutriFoto()
            this.correo=''
            this.pass=''
            this.nutri=''
            //this.notificarCorreo()
           }
        }
        if(result.isDismissed){
          this.correo=''
          this.pass=''
          this.nutri=''
          Swal.close()
        }
      })
    }

    registrarNutriFoto(){
      Swal.fire({
        text: "Te pedimos una foto de tu título para validar tu identidad",
        showCancelButton: true,
        confirmButtonText: "Tomar foto",
        heightAuto: false,
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if(result.isConfirmed){
          this.almacenarTitulo()
      }
        if(result.isDismissed){
          this.registrarNutri()
        }
      })
    }

    almacenarTitulo(){
      this.tomarFotografia().then(()=> {
        if(this.fotoTitulo != ''){
          this.notificarCorreo()
          this.fotoTitulo = ''
        } else {
          this.registrarNutriFoto()
        }
      })
    }

    async tomarFotografia() {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      this.fotoTitulo = image.base64String //ACÁ DEBERÍA ALMACENAR LA FOTO EN LA BD
    }


    mensajeError(mensaje:string){
      Swal.fire({
        icon:'error',
        text: mensaje,
        heightAuto: false
      })
    }

  }