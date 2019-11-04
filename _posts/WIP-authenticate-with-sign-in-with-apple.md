---
layout: post
title:  "Authenticate with Sign in with Apple"
date:   2019-07-06 12:00:00 +0200
categories: swift authentication
published: false
---

Apple surprised us at WWDC19 this year with their own Single Sign On experience: Sign in with Apple.

This new SSO is quite easy to implement on iOS ; but have many subtleties and needs server-side validation in order to stay secure.

<!--more-->

## iOS side: the button and the session restoration mechanism

On your application side, you should handle two separate mechanisms:

- Login/Register button that will trigger Sign-in with Apple
- Sign-in with apple status check on start; and session restoration if possible.

### Enable Sign in with Apple

In the capabilities of your application, just add "Sign in with Apple" to the entitlements. Xcode will handle the rest

### Login/Register button

It all start with AuthenticationServices import ; it'll provide you the official button ; and also the credential provider for login in.

{% highlight swift %}
import AuthenticationServices
{% endhighlight %}

In your LoginViewController, you want to add the new Sign-in with Apple button:

{% highlight swift %}
func viewDidLoad() {
    super.viewDidLoad()

    // ...

    // Adapt the style of the button depending on your app style
    let button = ASAuthorizationAppleIDButton(authorizationButtonType: .default, authorizationButtonStyle: .white)
    button.addTarget(self, #selector(self.signInWithApple), for: .touchUpInside)

    // Add the button at the correct place
    view.addSubview(button)
}

/// Will trigger Sign-in with apple mechanism
@objc func signInWithApple() {
    // Create an "AppleID" provider
    let provider = ASAuthorizationAppleIDProvider()
    // Create a new request out of it
    let request = provider.createRequest()
    // Add scopes that you may need (email and/or real name)
    // Please note that user can change those.
    request.requestedScopes = [.email]
    // Create a controller
    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self // We do not *yet* implements the delegate
    controller.performRequests()
}
{% endhighlight %}

### Sign-in with Apple callbacks

Now that we trigger Sign-in with Apple, we must respond to its responses.

{% highlight swift %}
extension LoginViewController: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        switch authorization.credential {
        case let credential as ASAuthorizationAppleIDCredential:
            // Store credential.user in the Keychain for later use when "checking sign-in with apple validity"
            Keychain.userId = credential.user

            // Send credential.authorizationCode and credential.identityToken to your server for authentication
            // Also send credential.email, credential.fullname if you need them for registering
            // You can, if you want, send credential.user for double check. But you'll get it from identityToken
            Networking.login(with: credential) { success in
                guard success else {
                    // Handle the error, present a failure message?
                    return
                }

                // Store the session for later use when "checking session validity"
                Keychain.session = HTTPCookieStorage.shared.sessionCookie

                // Change the app state to be "logged-in"
                self.present(HomeViewController(), animated: true)
            }
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        // Handle the error, present a failure message?
    }
}
{% endhighlight %}

Of course, most of those are pseudo-code, but it'll give you the direction of what you should do at different steps of the logging-in.

### Check Sign in with Apple status when application starts

The user may revoke the Sign-in with apple status at some point. That something you should respond to by logout the user, or at least no restoring the session at startup.

Since we still no restore anything, now is the right point to start!

In your SceneDelegate, you wanna check the status:

{% highlight swift %}
func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    ...

    checkAppleIdAndSessionStatus()
}

func checkAppleIdAndSessionStatus() {
    guard let appleId = Keychain.appleId else {
        // No apple id at all. If it's your only source of login, present the LoginViewController
        // If it's not, try to restore a "normal" session ; that is not linked to apple.
        // Otherwise, logout and present the login screen
        self.logout()
        return
    }

    let provider = ASAuthorizationAppleIDProvider()
    provider.getCredentialState(forUserID: appleId) { (state, error) in
        switch state {
        case .authorized:
            // AppleId is checked and authorized
            // We can check the session validity for our appleId that will be cross-check by our back-end
            Networking.checkSession(for: appleId) { success in
                guard success else {
                    // Handle the error, present a failure message?
                    // And show the LoginViewController
                    // You may want to trigger LoginViewController.signInWithApple() automatically
                    return
                }

                // Change the app state to present the home page
                self.window?.rootViewController?.present(HomeViewController(), animated: true)
            }
        default:
            // If your authentication is not Sign-in with apple only, still try to restore a "normal" session ; that is not linked to apple.
            // Otherwise, logout and present the login screen
            self.logout()
        }
    }
}
{% endhighlight %}

Now, you have the full process implemented in your application.

If you provide an email/password authentication mechanism already, you also want to have a ASAuthorizationPasswordProvider that will fetch the username/password out of the keychain/password management app when restoring the session from the user at the app startup

## Back-end side: validating the authentication

Of course, if an incoming webservice call says to your backend: "Hi! I'm user 8, give me a valid session", you won't take it seriously. That's why you needed a password mechanism, to authenticate and validate the fact that we are indeed dealing with the correct person.

But now, we retrieve a "credential id", provided by Apple, and be sure that it'll not enough to authenticate Apple identity.

### Cryptography to the help!

What if Apple could send you data in a way you're 100% sure the message comes from Apple, and no-one else?

And what if you can then re-validate the authentication request back to Apple, in a way that only you can send the message back to Apple ?

Asymmetrical encryption allow you just that!

Apple will encrypt their messages using their private key, that they are the only one to know.
They'll provide to us a public key, that will be of use for un-encrypting the messages.

Once we have proven that the message is correctly sent by Apple, we'll ask for confirmation, using our own private key, and Apple will read our authentication check using our public key.

This method of transferring data does not provide privacy (HTTPS will handle that part) ; but it assure "Provider authenticity".

Apple will knows we are the rightful back-end ; and we'll be sure about Apple identity.

We use this "signature" encryption to authenticate parties identities.

### Part 1: validate Apple response

If you followed, we received from our application webservice call an `identityToken` ; and maybe also a `userId` ; to cross check data.

For that, we need to get apple public key!

For NodeJS, using `request` ; that might end-up looking like this:

{% highlight js %}
  /**
   * Fetch Apple public key
   * @return {Promise<{kty: string, kid: string, use: string, alg: string, n: string, e: string}>}
   */
  function fetchApplePublicKey() {
    return new Promise((resolve, reject) => {
      request('https://appleid.apple.com/auth/keys', { json: true }, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(body.keys[0]);
      });
    });
  }
{% endhighlight %}

We can now use `jwt` (Json Web Token) in order to decrypt Apple identityToken:

{% highlight js %}
// This should be your bundle app identifier
var clientId = "fr.thomasdurand.mySuperApp"
// Fetch Apple's public key
this.fetchApplePublicKey().then((key) => {
    // Base64 back to string
    let identityToken = Buffer.from(req.body.identityToken, 'base64').toString('utf8');

    // Prepare the public key
    const pubKey = new NodeRSA();
    pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
    let applePublicKey = pubKey.exportKey(['public']);

    // Check the token against Apple key
    const token = jwt.verify(identityToken, applePublicKey, { algorithms: [key.alg] });
    if (token.iss !== 'https://appleid.apple.com') {
        throw new Error('unexpected provider. Expected: https://appleid.apple.com);
    }
    if (clientId !== undefined && token.aud !== clientId) {
        throw new Error('clientId is unexpected. Expected: ' + clientId);
    }
    if (token.exp < (Date.now() / 1000)) {
        throw new Error('id token has expired');
    }
    
    // We check userId congruency with identityToken
    // You may only do it if you provide userId in the request.
    // Otherwise, use token.sub as userId.
    if (token.sub !== req.body.appleId) {
        throw new Error('Unrecognized appleId for login');
    }

    // TODO: check validity with Apple, and then create session
}).catch(next);
{% endhighlight %}

### Part 2: check validity with Apple, and create the session

