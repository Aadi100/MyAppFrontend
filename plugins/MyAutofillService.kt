package com.aadii.myapp

import android.app.assist.AssistStructure
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.FillResponse
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import android.view.autofill.AutofillId
import android.view.View

/**
 * Minimal Android Autofill Service for My Daily App.
 *
 * This lets the OS list "My Daily App" under Settings > Autofill service, and it
 * correctly detects username/password fields on other screens. It does not yet
 * fill in real saved credentials from the Vault - the Vault's passwords are
 * stored server-side and only decrypted inside the JS app via an authenticated
 * API call, which this background service has no access to. Wiring this up to
 * real data needs a picker Activity that calls the vault API and returns the
 * chosen value through FillResponse's authentication intent.
 */
class MyAutofillService : AutofillService() {

    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        val structure = request.fillContexts.lastOrNull()?.structure
        if (structure == null) {
            callback.onSuccess(null)
            return
        }

        val fields = findAutofillFields(structure)
        if (fields.usernameId == null && fields.passwordId == null) {
            callback.onSuccess(null)
            return
        }

        // No saved-credential dataset is offered yet (see class doc), so this
        // service currently recognizes fields without filling any value.
        callback.onSuccess(FillResponse.Builder().build())
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        // Saving new credentials back into the Vault isn't implemented yet.
        callback.onSuccess()
    }

    private data class AutofillFields(
        var usernameId: AutofillId? = null,
        var passwordId: AutofillId? = null
    )

    private fun findAutofillFields(structure: AssistStructure): AutofillFields {
        val result = AutofillFields()
        val windowCount = structure.windowNodeCount
        for (i in 0 until windowCount) {
            val node = structure.getWindowNodeAt(i).rootViewNode
            traverse(node, result)
        }
        return result
    }

    private fun traverse(node: AssistStructure.ViewNode, result: AutofillFields) {
        val hints = node.autofillHints
        if (hints != null) {
            for (hint in hints) {
                when (hint) {
                    View.AUTOFILL_HINT_USERNAME, View.AUTOFILL_HINT_EMAIL_ADDRESS ->
                        if (result.usernameId == null) result.usernameId = node.autofillId
                    View.AUTOFILL_HINT_PASSWORD ->
                        if (result.passwordId == null) result.passwordId = node.autofillId
                }
            }
        }
        for (i in 0 until node.childCount) {
            traverse(node.getChildAt(i), result)
        }
    }
}
