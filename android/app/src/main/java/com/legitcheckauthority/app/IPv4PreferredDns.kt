package com.legitcheckauthority.app

import java.net.Inet4Address
import java.net.InetAddress
import okhttp3.Dns

/** Prefer IPv4 when both A and AAAA records exist (common RN/Vercel connectivity issue). */
class IPv4PreferredDns : Dns {
  override fun lookup(hostname: String): List<InetAddress> {
    val addresses =
        try {
          Dns.SYSTEM.lookup(hostname)
        } catch (_: Exception) {
          emptyList()
        }
    val ipv4 = addresses.filterIsInstance<Inet4Address>()
    return if (ipv4.isNotEmpty()) ipv4 else addresses
  }
}
